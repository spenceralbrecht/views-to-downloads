'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { ConnectedAccount } from '@/utils/tiktokService'

interface PublishToTikTokModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoUrl: string
  videoId: string
  published?: string
  publishedUrl?: string
  onPublishSuccess?: () => void
}

export function PublishToTikTokModal({
  open,
  onOpenChange,
  videoUrl,
  videoId,
  published,
  publishedUrl,
  onPublishSuccess
}: PublishToTikTokModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [publishSuccess, setPublishSuccess] = useState(false)
  const supabase = createClientComponentClient()
  
  // Load connected accounts when modal opens
  useEffect(() => {
    const loadConnectedAccounts = async () => {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const accounts = await tiktokService.getConnectedAccounts(session.user.id)
          setConnectedAccounts(accounts)
          // Default select the first account if available
          if (accounts.length > 0) {
            setSelectedAccountId(accounts[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading connected accounts:', error)
        toast({
          title: "Error",
          description: "Failed to load connected accounts",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (open) {
      loadConnectedAccounts()
      setPublishSuccess(false)
    }
  }, [open, supabase])
  
  const handleConnectTikTok = async () => {
    try {
      await tiktokService.initiateAuth()
      // The page will redirect to TikTok
    } catch (error) {
      console.error('Error connecting to TikTok:', error)
      toast({
        title: "Error",
        description: "Failed to connect to TikTok",
        variant: "destructive"
      })
    }
  }
  
  const publishToTikTok = async (videoUrl: string, accountId: string): Promise<{publishedUrl: string, success: boolean}> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('You must be logged in to publish to TikTok')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tiktok-publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        accountId,
        videoId,
        videoUrl
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw {
        ...data,
        message: data.error || 'Failed to publish video to TikTok'
      };
    }
    
    if (!data.success) {
      throw {
        ...data,
        message: data.error || 'TikTok API failed to process the video'
      };
    }
    
    return {
      publishedUrl: data.publishedUrl,
      success: true
    };
  }
  
  const handlePublish = async () => {
    if (!selectedAccountId) {
      toast({
        title: "Error",
        description: "Please select a TikTok account",
        variant: "destructive"
      })
      return
    }
    
    setIsPublishing(true)
    try {
      const result = await publishToTikTok(videoUrl, selectedAccountId)
      
      setPublishSuccess(true)
      toast({
        title: "Success",
        description: "Video published to TikTok successfully!",
      })
      
      if (onPublishSuccess) {
        onPublishSuccess();
      }
      
      setTimeout(() => onOpenChange(false), 1500)
      
    } catch (error: any) {
      console.error('Error publishing to TikTok:', error)

      // Check if this is a token-related error
      if (error.isTokenError) {
        toast({
          title: "Authentication Error",
          description: "Your TikTok connection has expired. Please reconnect your TikTok account.",
          variant: "destructive",
          action: (
            <Button variant="outline" onClick={handleConnectTikTok}>
              Reconnect
            </Button>
          ),
        })
      } else if (error.code === 'video_too_large') {
        toast({
          title: "Error",
          description: "The video file is too large for TikTok. Maximum size is 128MB.",
          variant: "destructive"
        })
      } else if (error.code === 'invalid_video_format') {
        toast({
          title: "Error",
          description: "Invalid video format. TikTok accepts MP4, WebM, and other common formats.",
          variant: "destructive"
        })
      } else if (error.message?.includes('Please review our integration guidelines')) {
        toast({
          title: "TikTok API Error",
          description: "We're experiencing some technical difficulties with TikTok. Please try again later.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to publish video to TikTok",
          variant: "destructive"
        })
      }
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
          ) : published === 'tiktok' && publishedUrl ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                <p className="text-sm font-medium mb-2">This video has already been published to TikTok!</p>
                <a 
                  href={publishedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                >
                  <span>View on TikTok</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                You can republish this video to a different TikTok account if needed.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : connectedAccounts.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm mb-4">
                Select the TikTok account you want to publish to:
              </p>
              
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {connectedAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.display_name || account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {publishSuccess && (
                <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
                  Video successfully published to TikTok!
                </div>
              )}
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
          {isTikTokEnabled() && !(published === 'tiktok' && publishedUrl) ? (
            <Button
              onClick={handlePublish}
              disabled={isPublishing || connectedAccounts.length === 0 || !selectedAccountId}
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
          ) : isTikTokEnabled() && published === 'tiktok' && publishedUrl ? (
            <Button
              onClick={() => onOpenChange(false)}
            >
              Close
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
