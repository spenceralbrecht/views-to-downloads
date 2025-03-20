import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { refreshTikTokToken } from '@/utils/tiktokService'

/**
 * TikTok Content Posting API Integration
 * 
 * This implementation follows TikTok's Content Posting API documentation:
 * - For direct posting: https://developers.tiktok.com/doc/content-posting-api-get-started
 * - For draft uploading: https://developers.tiktok.com/doc/content-posting-api-get-started-upload-content
 */

// Get the account details for a TikTok account
async function getAccountDetails(accountId: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  console.log('Fetching account details for ID:', accountId)
  
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('id', accountId)
    .single()
  
  if (error) {
    console.error('Error fetching account:', error)
    throw new Error(`Error fetching account: ${error.message}`)
  }
  
  // Log non-sensitive account info for debugging
  console.log('Account data:', {
    id: data.id,
    provider: data.provider,
    username: data.username,
    has_access_token: !!data.access_token,
    token_expires_at: data.token_expires_at
  })
  
  return data
}

// Update the account with new tokens
async function updateAccountTokens(accountId: string, accessToken: string, refreshToken: string, expiresIn: number) {
  const supabase = createRouteHandlerClient({ cookies })
  
  console.log('Updating account tokens for ID:', accountId)
  
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
  
  const { data, error } = await supabase
    .from('connected_accounts')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt.toISOString()
    })
    .eq('id', accountId)
    .select('*')
  
  if (error) {
    console.error('Error updating account tokens:', error)
    throw new Error(`Error updating account tokens: ${error.message}`)
  }
  
  return data
}

// Check if token is expired and refresh it if needed
async function ensureValidAccessToken(account: any) {
  // If there's no token_expires_at or the token is expired
  const now = new Date()
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  
  if (!expiresAt || now >= expiresAt) {
    console.log('Access token is expired or expiration date not set, attempting to refresh')
    
    if (!account.refresh_token) {
      throw new Error('No refresh token available')
    }
    
    const tokenResponse = await refreshTikTokToken(account.refresh_token)
    if (!tokenResponse) {
      throw new Error('Failed to refresh access token')
    }
    
    // Update account with new tokens
    await updateAccountTokens(
      account.id,
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      tokenResponse.expires_in
    )
    
    return tokenResponse.access_token
  }
  
  // Token is still valid
  return account.access_token
}

// Update the output_content record with the published URL
async function updateOutputContent(videoId: string, publishedUrl: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  console.log('Updating output_content with ID:', videoId)
  
  // Database schema verified: 'published' and 'published_url' fields exist in output_content table
  const { data, error } = await supabase
    .from('output_content')
    .update({
      published: 'tiktok',
      published_url: publishedUrl
    })
    .eq('id', videoId)
    .select('*')
  
  if (error) {
    console.error('Error updating output content:', error)
    throw new Error(`Error updating output content: ${error.message}`)
  }
  
  return data
}

/**
 * TikTok Direct Post Implementation
 * 
 * This follows the PULL_FROM_URL approach where we provide a video URL
 * and TikTok pulls and processes the video from that URL.
 */
async function directPostToTikTok(accessToken: string, videoUrl: string, username: string) {
  try {
    console.log('Initiating TikTok direct post')
    
    // Step 1: Get creator info (recommended in docs)
    const creatorInfoResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({})
    })
    
    if (!creatorInfoResponse.ok) {
      const errorData = await creatorInfoResponse.json()
      console.error('TikTok creator info error:', errorData)
      throw new Error(`Creator info error: ${errorData.error?.message || 'Unknown error'}`)
    }
    
    const creatorInfo = await creatorInfoResponse.json()
    console.log('Creator info retrieved:', {
      username: creatorInfo.data?.creator_username,
      nickname: creatorInfo.data?.creator_nickname
    })
    
    // Step 2: Initialize the video upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        post_info: {
          title: 'Created with Views to Downloads',
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      })
    })
    
    if (!initResponse.ok) {
      const errorData = await initResponse.json()
      console.error('TikTok init error:', errorData)
      throw new Error(`Init error: ${errorData.error?.message || 'Unknown error'}`)
    }
    
    const initData = await initResponse.json()
    console.log('Upload initialized, publish_id:', initData.data?.publish_id)
    
    const publishId = initData.data?.publish_id
    if (!publishId) {
      throw new Error('No publish_id received from TikTok')
    }
    
    // Step 3: Check status (poll until complete)
    // In production, this should be a polling mechanism or webhook
    let statusData
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between polls
      
      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          publish_id: publishId
        })
      })
      
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json()
        console.error('TikTok status check error:', errorData)
        throw new Error(`Status check error: ${errorData.error?.message || 'Unknown error'}`)
      }
      
      statusData = await statusResponse.json()
      console.log('Status update:', statusData)
      
      // Check if status is SUCCESS or FAILED
      if (statusData.data?.status === 'SUCCESS') {
        break
      }
      
      if (statusData.data?.status === 'FAILED') {
        throw new Error(`Upload failed: ${statusData.data?.fail_reason || 'Unknown reason'}`)
      }
      
      attempts++
    }
    
    // Use the username from TikTok API if available, or fall back to our stored username
    const tiktokUsername = creatorInfo.data?.creator_username || username
    
    // If available, use video_id from the status response
    // Otherwise, fallback to the publish_id or use the username profile URL
    let tiktokUrl
    if (statusData?.data?.video_id) {
      tiktokUrl = `https://www.tiktok.com/@${tiktokUsername}/video/${statusData.data.video_id}`
    } else {
      // Fallback to profile URL if no video ID is available
      tiktokUrl = `https://www.tiktok.com/@${tiktokUsername}`
    }
    
    return tiktokUrl
  } catch (error) {
    console.error('Error in directPostToTikTok:', error)
    throw error
  }
}

/**
 * TikTok Upload Draft Implementation (Alternative if direct post isn't available)
 * 
 * This follows the PULL_FROM_URL approach for draft upload
 */
async function uploadDraftToTikTok(accessToken: string, videoUrl: string, username: string) {
  try {
    console.log('Initiating TikTok draft upload')
    
    // Initialize the video upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      })
    })
    
    if (!initResponse.ok) {
      const errorData = await initResponse.json()
      console.error('TikTok init error:', errorData)
      throw new Error(`Init error: ${errorData.error?.message || 'Unknown error'}`)
    }
    
    const initData = await initResponse.json()
    console.log('Draft upload initialized, publish_id:', initData.data?.publish_id)
    
    const publishId = initData.data?.publish_id
    if (!publishId) {
      throw new Error('No publish_id received from TikTok')
    }
    
    // Step 3: Check status (poll until complete)
    let statusData
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between polls
      
      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          publish_id: publishId
        })
      })
      
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json()
        console.error('TikTok status check error:', errorData)
        throw new Error(`Status check error: ${errorData.error?.message || 'Unknown error'}`)
      }
      
      statusData = await statusResponse.json()
      console.log('Status update:', statusData)
      
      // Check if status is SUCCESS or FAILED
      if (statusData.data?.status === 'SUCCESS') {
        break
      }
      
      if (statusData.data?.status === 'FAILED') {
        throw new Error(`Upload failed: ${statusData.data?.fail_reason || 'Unknown reason'}`)
      }
      
      attempts++
    }
    
    // For drafts, we don't get a direct video URL since it's not published yet
    // Return the user's TikTok profile URL
    return `https://www.tiktok.com/@${username}`
  } catch (error) {
    console.error('Error in uploadDraftToTikTok:', error)
    throw error
  }
}

// Fallback to mock implementation if API calls fail
function getMockTikTokUrl(username: string) {
  const mockVideoId = Date.now().toString()
  return `https://www.tiktok.com/@${username}/video/${mockVideoId}`
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { accountId, videoId, videoUrl } = body
    
    console.log('Publishing request received:', { accountId, videoId, videoUrl })
    
    if (!accountId || !videoId || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // Get the TikTok account details
    const account = await getAccountDetails(accountId)
    
    if (!account || account.provider !== 'tiktok') {
      return NextResponse.json(
        { error: 'Invalid TikTok account' },
        { status: 400 }
      )
    }
    
    // Extract username and access token
    const username = account.username || 'username'
    let accessToken
    let publishedUrl
    let isDirectPost = true // Set to false to use draft upload instead
    let isMockImplementation = false
    
    try {
      // Ensure we have a valid access token
      try {
        accessToken = await ensureValidAccessToken(account)
        if (!accessToken) {
          throw new Error('No valid access token available')
        }
      } catch (tokenError: any) {
        console.error('Token refresh error:', tokenError)
        throw new Error(`Token error: ${tokenError.message}`)
      }
      
      // Try to use the appropriate TikTok API based on the available scope
      if (isDirectPost) {
        // Attempt direct post (requires video.publish scope)
        publishedUrl = await directPostToTikTok(accessToken, videoUrl, username)
      } else {
        // Fallback to draft upload (requires video.upload scope)
        publishedUrl = await uploadDraftToTikTok(accessToken, videoUrl, username)
      }
    } catch (error) {
      console.error('TikTok API error, falling back to mock implementation:', error)
      // If API fails, fall back to a mock URL for testing
      publishedUrl = getMockTikTokUrl(username)
      isMockImplementation = true
    }
    
    // Only update the output_content record if it's not the mock implementation
    if (!isMockImplementation) {
      // Update the output_content record with the published URL
      await updateOutputContent(videoId, publishedUrl)
    }
    
    // Return success response
    return NextResponse.json({
      success: !isMockImplementation,
      publishedUrl,
      message: isMockImplementation 
        ? 'Failed to publish to TikTok, using mock URL for testing' 
        : 'Video published to TikTok successfully'
    })
  } catch (error: any) {
    console.error('Error in TikTok publish API:', error)
    
    // Check if this is a token-related error
    const isTokenError = error.message && (
      error.message.includes('token') || 
      error.message.includes('access_token') ||
      error.message.includes('authorization')
    )
    
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred while publishing to TikTok',
        isTokenError: isTokenError
      },
      { status: isTokenError ? 401 : 500 }
    )
  }
}
