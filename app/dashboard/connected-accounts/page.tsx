'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Plus, CheckCircle, XCircle, Trash2, Plug } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { accountService } from '@/utils/accountService'
import { tiktokService } from '@/utils/tiktokService'
import { ConnectedAccount } from '@/utils/tiktokService'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isTikTokEnabled } from '@/utils/featureFlags'

export default function ConnectedAccounts() {
  const [isLoading, setIsLoading] = useState(true)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Extract TikTok success and data parameters from URL
  const tiktokSuccess = searchParams.get('tiktok_success')
  const tiktokData = searchParams.get('tiktok_data')

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!data.session) {
          router.push('/login')
          return
        }
        
        setSession(data.session)
        
        // Get all connected accounts
        try {
          const accounts = await accountService.getAllConnectedAccounts(data.session.user.id)
          setConnectedAccounts(accounts)
          
          // Check for TikTok data in URL parameters first
          if (tiktokSuccess === 'true' && tiktokData) {
            console.log('Found TikTok data in URL parameters');
            
            try {
              // Use a more robust approach to decode the base64 data
              // First, make sure we're working with a clean base64 string
              // Replace any URL-unsafe characters with their base64 equivalents
              const cleanBase64 = tiktokData
                .replace(/-/g, '+')
                .replace(/_/g, '/');
              
              // Add padding if needed
              const paddedBase64 = cleanBase64.padEnd(
                cleanBase64.length + (4 - (cleanBase64.length % 4 || 4)) % 4, 
                '='
              );
              
              // Decode the base64 string
              const jsonString = Buffer.from(paddedBase64, 'base64').toString('utf-8');
              console.log('Decoded JSON string:', jsonString.substring(0, 100) + '...');
              
              // Parse the JSON
              const decodedData = JSON.parse(jsonString);
              console.log('Parsed TikTok data:', decodedData);
              
              // Save the account
              const result = await tiktokService.saveAccount(
                data.session.user.id,
                {
                  open_id: decodedData.open_id,
                  union_id: decodedData.union_id || decodedData.open_id,
                  display_name: decodedData.display_name,
                  avatar_url: decodedData.profile_picture,
                  avatar_url_100: decodedData.profile_picture
                },
                decodedData.access_token,
                decodedData.refresh_token,
                decodedData.expires_in
              )
              
              if (result) {
                // Successfully saved the account, show success message
                setSuccessMessage(`Successfully connected TikTok account: ${decodedData.display_name}`)
                
                // Refresh the connected accounts list
                const updatedAccounts = await accountService.getAllConnectedAccounts(data.session.user.id)
                setConnectedAccounts(updatedAccounts)
                
                // Remove the URL parameters to avoid processing the data again on refresh
                router.replace('/dashboard/connected-accounts');
              }
            } catch (error) {
              console.error('Error processing TikTok data:', error)
              setError('Failed to connect TikTok account. Please try again.')
            }
          }
        } catch (error) {
          console.error('Error fetching connected accounts:', error)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    getSession()
  }, [supabase, router, searchParams])

  const connectTikTok = async () => {
    if (!session) return
    
    try {
      // Initiate the TikTok OAuth flow
      await tiktokService.initiateAuth()
      
      // The page will redirect to TikTok, so we don't need to reset connecting state
      // It will be reset when the user returns to the page
    } catch (error) {
      console.error('Error connecting to TikTok:', error)
    }
  }

  const disconnectAccount = async (accountId: string) => {
    try {
      await accountService.disconnectAccount(accountId)
      setConnectedAccounts(connectedAccounts.filter(account => account.id !== accountId))
    } catch (error) {
      console.error('Error disconnecting account:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 pb-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Connected Accounts</h1>
            <p className="text-textMuted max-w-2xl">
              Connect your social media accounts to enhance your content creation workflow.
            </p>
          </div>
          
          {isTikTokEnabled() ? (
            <Button 
              onClick={() => connectTikTok()}
              className="btn-gradient"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Account
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-textMuted">Coming Soon</span>
              <Button 
                disabled={true}
                className="opacity-70 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Connect Account
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Success and Error Alerts */}
      {successMessage && (
        <Alert className="mb-6 bg-primary/5 border-primary/20">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-text">Success</AlertTitle>
          <AlertDescription className="text-textMuted">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-danger/5 border-danger/20">
          <XCircle className="h-4 w-4 text-danger" />
          <AlertTitle className="text-text">Error</AlertTitle>
          <AlertDescription className="text-textMuted">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {connectedAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedAccounts.map((account) => (
            <Card key={account.id} className="overflow-hidden border-border bg-card hover-primary">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border border-border bg-sidebar flex items-center justify-center">
                      {account.profile_picture ? (
                        <img 
                          src={account.profile_picture} 
                          alt={account.display_name || account.username}
                          className="object-cover h-12 w-12"
                        />
                      ) : (
                        <div className="text-primary text-xl font-bold">
                          {(account.display_name || account.username || 'User').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text">{account.display_name || account.username}</p>
                      <p className="text-sm text-textMuted">
                        {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-textMuted">Connected on:</span> <span className="text-text">{new Date(account.created_at).toLocaleDateString()}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-textMuted">Status:</span> <span className="inline-flex items-center text-primary"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-border p-4 bg-sidebar">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => disconnectAccount(account.id)}
                    className="w-full text-textMuted hover:text-danger hover:border-danger/50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Plug className="h-10 w-10 text-primary opacity-60" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">No accounts connected yet</h3>
          <p className="text-textMuted mb-8 max-w-md mx-auto">
            Connect your TikTok account to unlock powerful features for content creation and distribution.
          </p>
          <div className="max-w-xs mx-auto">
            {isTikTokEnabled() ? (
              <Button onClick={() => connectTikTok()} className="btn-gradient w-full">
                <Plus className="w-4 h-4 mr-2" />
                Connect TikTok Account
              </Button>
            ) : (
              <div className="space-y-2">
                <Button disabled className="w-full opacity-60 cursor-not-allowed">
                  TikTok Integration Coming Soon
                </Button>
                <p className="text-xs text-textMuted">We're working on adding TikTok integration. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 