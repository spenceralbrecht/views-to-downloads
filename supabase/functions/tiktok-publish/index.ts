import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// TikTok API configuration
const TIKTOK_CLIENT_KEY = Deno.env.get('NEXT_PUBLIC_TIKTOK_CLIENT_KEY') || ''
const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET') || ''

interface RequestBody {
  accountId: string
  videoId: string
  videoUrl: string
}

// Response interface
interface Response {
  success: boolean
  publishedUrl?: string
  message?: string
  error?: string
}

/**
 * Refresh a TikTok access token using the refresh token
 */
async function refreshTikTokToken(refreshToken: string) {
  try {
    console.log('Refreshing access token...')
    
    const tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/'
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Token refresh error:', response.status, errorData)
      return null
    }

    const data = await response.json()
    console.log('Token refresh successful, expires in', data.expires_in, 'seconds')
    return data
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

/**
 * Check if token is expired and refresh it if needed
 */
async function ensureValidAccessToken(account: any, supabase: any) {
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
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in)
    
    const { data, error } = await supabase
      .from('connected_accounts')
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expires_at: expiresAt.toISOString()
      })
      .eq('id', account.id)
      .select('*')
    
    if (error) {
      console.error('Error updating account tokens:', error)
      throw new Error(`Error updating account tokens: ${error.message}`)
    }
    
    return tokenResponse.access_token
  }
  
  // Token is still valid
  return account.access_token
}

/**
 * Download a file from a URL
 */
async function downloadFile(url: string): Promise<ArrayBuffer> {
  console.log('Downloading file from URL:', url)
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }
  
  const buffer = await response.arrayBuffer()
  console.log(`File downloaded, size: ${buffer.byteLength} bytes`)
  return buffer
}

/**
 * Upload a video to TikTok using the FILE_UPLOAD method
 */
async function uploadVideoToTikTok(accessToken: string, videoBuffer: ArrayBuffer, username: string) {
  console.log('Initiating TikTok direct post with FILE_UPLOAD method')
  
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
  
  // Step 2: Initialize the video upload with FILE_UPLOAD method
  const videoSize = videoBuffer.byteLength
  
  // Check video size (TikTok limit is 128MB)
  if (videoSize > 128 * 1024 * 1024) {
    throw {
      code: 'video_too_large',
      message: 'Video file size exceeds TikTok\'s limit of 128MB'
    }
  }
  
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
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1
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
  const uploadUrl = initData.data?.upload_url
  
  if (!publishId || !uploadUrl) {
    throw new Error('No publish_id or upload_url received from TikTok')
  }
  
  // Step 3: Upload the video file to the provided URL
  console.log('Uploading video to TikTok...')
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
      'Content-Type': 'video/mp4'
    },
    body: videoBuffer
  })
  
  if (!uploadResponse.ok) {
    let errorText = await uploadResponse.text()
    console.error('TikTok upload error:', uploadResponse.status, errorText)
    try {
      const errorData = JSON.parse(errorText)
      throw new Error(`Upload error: ${errorData.error?.message || 'Unknown error'}`)
    } catch (e) {
      throw new Error(`Upload error: ${uploadResponse.statusText}`)
    }
  }
  
  console.log('Video file uploaded successfully')
  
  // Step 4: Check status (poll until complete)
  let statusData
  let attempts = 0
  const maxAttempts = 10
  
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
    
    if (statusData.data?.status === 'SUCCESS') {
      break
    }
    
    if (statusData.data?.status === 'FAILED') {
      throw new Error(`Upload failed: ${statusData.data?.fail_reason || 'Unknown reason'}`)
    }
    
    attempts++
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Upload status check timed out')
  }
  
  // Use the username from TikTok API if available, or fall back to our stored username
  const tiktokUsername = creatorInfo.data?.creator_username || username
  
  // If available, use video_id from the status response
  // Otherwise, fallback to the username profile URL
  let tiktokUrl
  if (statusData?.data?.video_id) {
    tiktokUrl = `https://www.tiktok.com/@${tiktokUsername}/video/${statusData.data.video_id}`
  } else {
    throw new Error('No video ID received from TikTok')
  }
  
  return tiktokUrl
}

// Update the output_content record with the published URL
async function updateOutputContent(supabase: any, videoId: string, publishedUrl: string) {
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

serve(async (req) => {
  // Create a Supabase client with the Deno runtime
  const supabaseClient = createClient(
    // Supabase API URL - env var exported by default.
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase API ANON KEY - env var exported by default.
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    // Create client with Auth context of the user that called the function.
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    // Parse the request body
    const body: RequestBody = await req.json()
    const { accountId, videoId, videoUrl } = body
    
    console.log('Publishing request received:', { accountId, videoId, videoUrl })
    
    if (!accountId || !videoId || !videoUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters' 
        }),
        { 
          status: 400, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Get the TikTok account details from Supabase
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (accountError || !account || account.provider !== 'tiktok') {
      console.error('Error fetching account:', accountError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid TikTok account' 
        }),
        { 
          status: 400, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Extract username
    const username = account.username || ''
    let accessToken
    let publishedUrl
    
    // Ensure we have a valid access token
    try {
      accessToken = await ensureValidAccessToken(account, supabaseClient)
      if (!accessToken) {
        throw new Error('No valid access token available')
      }
    } catch (tokenError: any) {
      console.error('Token refresh error:', tokenError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: tokenError.message,
          isTokenError: true
        }),
        { 
          status: 401, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    try {
      // Download the video file from the provided URL
      const videoBuffer = await downloadFile(videoUrl)
      
      // Upload to TikTok using FILE_UPLOAD method
      publishedUrl = await uploadVideoToTikTok(accessToken, videoBuffer, username)
      
      // Update the output_content record with the published URL
      await updateOutputContent(supabaseClient, videoId, publishedUrl)
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          publishedUrl,
          message: 'Video published to TikTok successfully'
        }),
        { 
          status: 200, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      )
    } catch (error: any) {
      console.error('Error in TikTok upload process:', error)
      
      // Determine the type of error and return appropriate response
      const errorResponse = {
        success: false,
        error: error.message || 'An error occurred while publishing to TikTok',
        code: error.code
      }
      
      // Return specific status codes based on error type
      let statusCode = 500
      if (error.code === 'video_too_large' || error.code === 'invalid_video_format') {
        statusCode = 400
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: statusCode, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      )
    }
    
  } catch (error: any) {
    console.error('Error in TikTok publish edge function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An error occurred while publishing to TikTok'
      }),
      { 
        status: 500, 
        headers: { ...headers, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 