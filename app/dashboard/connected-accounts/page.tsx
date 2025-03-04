'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { Loader2, Plug, CheckCircle, XCircle, Plus } from 'lucide-react'
import Image from 'next/image'
import { accountService } from '@/utils/accountService'
import { tiktokService } from '@/utils/tiktokService'
import { ConnectedAccount } from '@/utils/tiktokService'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AddAccountModal } from '@/components/AddAccountModal'

export default function ConnectedAccounts() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<boolean>(false)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  
  // Get success and error messages from URL
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
      
      // Fetch connected accounts
      if (session?.user) {
        try {
          const accounts = await accountService.getAllConnectedAccounts(session.user.id)
          setConnectedAccounts(accounts)
        } catch (error) {
          console.error('Error fetching connected accounts:', error)
        }
      }
    }
    
    getUser()
  }, [supabase])

  const connectTikTok = async () => {
    if (!user) return
    
    setConnecting(true)
    
    try {
      // Initiate the TikTok OAuth flow
      await tiktokService.initiateAuth()
      
      // The page will redirect to TikTok, so we don't need to reset connecting state
      // It will be reset when the user returns to the page
    } catch (error) {
      console.error('Error connecting to TikTok:', error)
      setConnecting(false)
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

  // Get error message based on error code
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'oauth_error':
        return 'There was an error connecting to TikTok. Please try again.'
      case 'missing_params':
        return 'Missing required parameters from TikTok. Please try again.'
      case 'server_error':
        return 'There was a server error. Please try again later.'
      case 'state_mismatch':
        return 'Security validation failed. Please try again.'
      case 'token_error':
        return 'Failed to get access token from TikTok. Please try again.'
      case 'profile_error':
        return 'Failed to get your TikTok profile. Please try again.'
      case 'missing_code_verifier':
        return 'Authentication data was lost. Please try connecting again and make sure cookies are enabled.'
      case 'code_challenge_method_not_supported':
        return 'TikTok authentication method not supported. Please contact support.'
      case 'invalid_request':
        return 'Invalid request to TikTok. Please try again.'
      case 'unauthorized_client':
        return 'Unauthorized client. Please contact support.'
      case 'access_denied':
        return 'Access denied by TikTok. You may have declined the authorization.'
      case 'unsupported_response_type':
        return 'Unsupported response type. Please contact support.'
      case 'invalid_scope':
        return 'Invalid scope requested. Please contact support.'
      case 'server_error':
        return 'TikTok server error. Please try again later.'
      case 'temporarily_unavailable':
        return 'TikTok service is temporarily unavailable. Please try again later.'
      case 'client_key':
        return 'Invalid TikTok client key. Please check your TikTok developer settings and ensure your app is properly configured.'
      default:
        return 'An unknown error occurred. Please try again.'
    }
  }

  if (loading) {
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
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="btn-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </Button>
      </div>

      {/* Success and Error Alerts */}
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            Your TikTok account has been successfully connected.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {getErrorMessage(error)}
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
                      <Image 
                        src={account.profile_picture || 'https://placehold.co/100x100'} 
                        alt={account.username}
                        fill
                        className="object-cover"
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
                    {account.metadata?.follower_count && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Followers:</span> {account.metadata.follower_count.toLocaleString()}
                      </p>
                    )}
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
          <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No accounts connected yet</p>
          <p className="text-sm text-muted-foreground mb-6">Account connection feature coming soon!</p>
          <Button onClick={() => setIsModalOpen(true)} disabled>Connect Account (Coming Soon)</Button>
        </div>
      )}

      <AddAccountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConnectTikTok={connectTikTok}
        connecting={connecting}
      />
    </div>
  )
} 