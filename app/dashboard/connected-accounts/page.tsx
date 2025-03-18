'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react'
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Connected Accounts</h1>
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
            <span className="text-xs text-muted-foreground">Coming Soon</span>
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

      {/* Success and Error Alerts */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {connectedAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedAccounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <img 
                        src={account.profile_picture || 'https://placehold.co/100x100'} 
                        alt={account.display_name || account.username}
                        className="object-cover h-12 w-12"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{account.display_name || account.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Connected on:</span> {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="border-t p-4 bg-muted/20">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => disconnectAccount(account.id)}
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <img src="/plug.svg" alt="Plug" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No accounts connected yet</p>
          <p className="text-sm text-muted-foreground mb-6">Connect your TikTok account to enhance your content creation workflow.</p>
          {isTikTokEnabled() ? (
            <Button onClick={() => connectTikTok()}>Connect Account</Button>
          ) : (
            <Button disabled className="opacity-70 cursor-not-allowed">TikTok Integration Coming Soon</Button>
          )}
        </div>
      )}
    </div>
  )
} 