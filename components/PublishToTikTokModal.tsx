'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from 'lucide-react'
import { tiktokService } from '@/utils/tiktokService'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { isTikTokEnabled } from '@/utils/featureFlags'

interface PublishToTikTokModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoUrl: string
  videoId: string
}

export function PublishToTikTokModal({
  open,
  onOpenChange,
  videoUrl,
  videoId
}: PublishToTikTokModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [hasConnectedAccount, setHasConnectedAccount] = useState<boolean | null>(null)
  const [isCheckingAccount, setIsCheckingAccount] = useState(true)
  const supabase = createClientComponentClient()
  
  // Check if user has connected TikTok account
  useState(() => {
    const checkConnectedAccount = async () => {
      setIsCheckingAccount(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const accounts = await tiktokService.getConnectedAccounts(session.user.id)
          setHasConnectedAccount(accounts.length > 0)
        } else {
          setHasConnectedAccount(false)
        }
      } catch (error) {
        console.error('Error checking connected accounts:', error)
        setHasConnectedAccount(false)
      } finally {
        setIsCheckingAccount(false)
      }
    }
    
    if (open) {
      checkConnectedAccount()
    }
  })
  
  const handleConnectTikTok = async () => {
    try {
      await tiktokService.initiateAuth()
      // The page will redirect to TikTok
    } catch (error) {
      console.error('Error connecting to TikTok:', error)
    }
  }
  
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      // In a real implementation, this would call an API to publish the video to TikTok
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      onOpenChange(false)
    } catch (error) {
      console.error('Error publishing to TikTok:', error)
    } finally {
      setIsPublishing(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish to TikTok</DialogTitle>
          <DialogDescription>
            Share this video directly to your TikTok account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {!isTikTokEnabled() ? (
            <div className="space-y-4 text-center py-4">
              <p className="text-sm">
                TikTok integration is coming soon! This feature is currently under development.
              </p>
              <Button disabled className="opacity-70 cursor-not-allowed">
                Coming Soon
              </Button>
            </div>
          ) : isCheckingAccount ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : hasConnectedAccount ? (
            <div className="space-y-4">
              <p className="text-sm">
                Your video will be published to your connected TikTok account. You can add a caption and hashtags before publishing.
              </p>
              {/* In a real implementation, we would add fields for caption, hashtags, etc. */}
            </div>
          ) : (
            <div className="space-y-4 text-center py-4">
              <p className="text-sm">
                Connect your TikTok account to publish videos directly to TikTok.
              </p>
              <Button onClick={handleConnectTikTok}>
                Connect TikTok Account
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {isTikTokEnabled() ? (
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !hasConnectedAccount}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish to TikTok'
              )}
            </Button>
          ) : (
            <Button
              disabled
              className="opacity-70 cursor-not-allowed"
            >
              Coming Soon
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
