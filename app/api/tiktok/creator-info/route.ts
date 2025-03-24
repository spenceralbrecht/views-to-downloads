import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { refreshTikTokToken } from '@/utils/tiktokService'

// Get the account details for a TikTok account
async function getAccountDetails(accountId: string) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('id', accountId)
    .single()
  
  if (error) {
    throw new Error(`Account not found: ${error.message}`)
  }
  
  return data
}

// Update the account with new tokens
async function updateAccountTokens(accountId: string, accessToken: string, refreshToken: string, expiresIn: number) {
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
  
  const supabase = createRouteHandlerClient({ cookies })
  const { error } = await supabase
    .from('connected_accounts')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt.toISOString()
    })
    .eq('id', accountId)
  
  if (error) {
    throw new Error(`Failed to update account tokens: ${error.message}`)
  }
}

// Check if token is expired and refresh it if needed
async function ensureValidAccessToken(account: any) {
  const tokenExpiresAt = new Date(account.token_expires_at)
  const now = new Date()
  
  // If token expires in less than 5 minutes, refresh it
  const tokenExpiresInSeconds = Math.floor((tokenExpiresAt.getTime() - now.getTime()) / 1000)
  const tokenNeedsRefresh = tokenExpiresInSeconds < 300
  
  if (tokenNeedsRefresh) {
    console.log(`Token expires in ${tokenExpiresInSeconds}s, refreshing...`)
    
    const refreshedTokens = await refreshTikTokToken(account.refresh_token)
    
    if (!refreshedTokens) {
      throw new Error('Failed to refresh TikTok token')
    }
    
    const { access_token, refresh_token, expires_in } = refreshedTokens
    
    // Update the account with new tokens
    await updateAccountTokens(account.id, access_token, refresh_token, expires_in)
    
    return access_token
  }
  
  return account.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json()
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }
    
    // Get account details
    const account = await getAccountDetails(accountId)
    
    // Ensure we have a valid access token
    const accessToken = await ensureValidAccessToken(account)
    
    // Call TikTok API to get creator info
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
      
      // Check if this is a token-related error
      const isTokenError = errorData.error?.code === 'access_token_invalid' || 
                           errorData.error?.code === 'access_token_expired'
      
      return NextResponse.json({ 
        error: `Creator info error: ${errorData.error?.message || 'Unknown error'}`,
        isTokenError
      }, { status: 500 })
    }
    
    const creatorInfo = await creatorInfoResponse.json()
    
    return NextResponse.json({ data: creatorInfo.data || {} })
  } catch (error: any) {
    console.error('Error in creator-info API route:', error)
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 })
  }
}
