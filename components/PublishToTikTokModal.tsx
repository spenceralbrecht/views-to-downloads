'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Check } from 'lucide-react'
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PublishToTikTokModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoUrl: string
  videoId: string
  published?: string
  publishedUrl?: string
  onPublishSuccess?: () => void
  isPhoto?: boolean
}

// Define the PostInfo interface to match TikTok requirements
interface PostInfo {
  title: string;
  privacy_level: string;
  disable_comment: boolean;
  disable_duet: boolean;
  disable_stitch: boolean;
  is_branded_content: boolean;
  is_brand_organic: boolean;
}

// Define the creator info interface
interface CreatorInfo {
  privacy_level_options: string[];
  creator_username?: string;
  creator_nickname?: string;
  disabled_comment_setting?: boolean;
  disabled_duet_setting?: boolean;
  disabled_stitch_setting?: boolean;
}

export function PublishToTikTokModal({
  open,
  onOpenChange,
  videoUrl,
  videoId,
  published,
  publishedUrl,
  onPublishSuccess,
  isPhoto = false
}: PublishToTikTokModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [publishSuccess, setPublishSuccess] = useState(false)
  const supabase = createClientComponentClient()

  // Post info states
  const [title, setTitle] = useState("")
  const [privacyLevel, setPrivacyLevel] = useState<string>("")
  const [allowComment, setAllowComment] = useState(false)
  const [allowDuet, setAllowDuet] = useState(false)
  const [allowStitch, setAllowStitch] = useState(false)
  
  // Commercial Content Disclosure states
  const [isDisclosureEnabled, setIsDisclosureEnabled] = useState(false)
  const [yourBrand, setYourBrand] = useState(false)
  const [brandedContent, setBrandedContent] = useState(false)
  
  // Prevent private visibility when any disclosure content is selected
  useEffect(() => {
    if ((brandedContent || yourBrand) && privacyLevel === 'SELF_ONLY') {
      setPrivacyLevel("")
      toast({
        title: "Visibility Adjusted",
        description: "Private visibility is not allowed for disclosed content. Please select a different privacy level.",
        variant: "destructive"
      })
    }
  }, [brandedContent, yourBrand, privacyLevel])

  // Add logic to handle privacy level changes affecting disclosure options
  useEffect(() => {
    // If privacy is set to Private, ensure all disclosure options are unchecked and notify user
    if (privacyLevel === 'SELF_ONLY') {
      if (brandedContent || yourBrand) {
        setBrandedContent(false)
        setYourBrand(false)
        toast({
          title: "Disclosure Options Disabled",
          description: "Content disclosure cannot be used when visibility is set to Private.",
          variant: "destructive" // Use destructive variant for warnings
        })
      }
    }
  }, [privacyLevel, brandedContent, yourBrand])

  // Creator info state
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null)
  const [isLoadingCreatorInfo, setIsLoadingCreatorInfo] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
      
      // Reset form values
      setTitle("")
      setPrivacyLevel("")
      setAllowComment(false)
      setAllowDuet(false)
      setAllowStitch(false)
      setIsDisclosureEnabled(false)
      setYourBrand(false)
      setBrandedContent(false)
    }
  }, [open, supabase])
  
  // Load creator info when an account is selected
  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (!selectedAccountId) return
      
      setIsLoadingCreatorInfo(true)
      try {
        const info = await tiktokService.getCreatorInfo(selectedAccountId)
        setCreatorInfo(info)
        
        // Reset privacy level since available options may have changed
        setPrivacyLevel("")
      } catch (error) {
        console.error('Error loading creator info:', error)
        toast({
          title: "Error",
          description: "Failed to load TikTok creator info",
          variant: "destructive"
        })
      } finally {
        setIsLoadingCreatorInfo(false)
      }
    }
    
    if (selectedAccountId) {
      fetchCreatorInfo()
    }
  }, [selectedAccountId])
  
  // Add an effect to load the video when the modal opens
  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.load();
    }
  }, [open, videoUrl]);
  
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
  
  const publishToTikTok = async (videoUrl: string, accountId: string, postInfo: PostInfo): Promise<{publishedUrl: string, success: boolean}> => {
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
        videoUrl,
        postInfo
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
    // Validate form
    if (!selectedAccountId) {
      toast({
        title: "Error",
        description: "Please select a TikTok account",
        variant: "destructive"
      })
      return
    }
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your post",
        variant: "destructive"
      })
      return
    }
    
    if (!privacyLevel) {
      toast({
        title: "Error",
        description: "Please select a privacy setting",
        variant: "destructive"
      })
      return
    }
    
    // Additional validation for disclosure
    if (isDisclosureEnabled && !yourBrand && !brandedContent) {
      toast({
        title: "Disclosure Required",
        description: "You must select at least one option (promoting yourself or a third party) when disclosure is enabled.",
        variant: "destructive"
      })
      return
    }
    
    // Prepare post info according to TikTok API requirements
    const postInfo: PostInfo = {
      title: title.trim(),
      privacy_level: privacyLevel,
      disable_comment: !allowComment,
      disable_duet: !allowDuet,
      disable_stitch: !allowStitch,
      is_branded_content: isDisclosureEnabled && brandedContent,
      is_brand_organic: isDisclosureEnabled && yourBrand
    }
    
    setIsPublishing(true)
    try {
      const result = await publishToTikTok(videoUrl, selectedAccountId, postInfo)
      
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
  
  // Function to render privacy options based on creator info
  const renderPrivacyOptions = () => {
    if (!creatorInfo?.privacy_level_options || creatorInfo.privacy_level_options.length === 0) {
      return (
        <SelectItem value="PUBLIC_TO_EVERYONE">Public</SelectItem>
      )
    }
    
    return creatorInfo.privacy_level_options.map(option => {
      let displayName = option;
      
      // Map API values to user-friendly names
      if (option === 'PUBLIC_TO_EVERYONE') displayName = 'Public';
      else if (option === 'MUTUAL_FOLLOW_FRIENDS') displayName = 'Friends';
      else if (option === 'SELF_ONLY') displayName = 'Private';
      else if (option === 'FOLLOWER_OF_CREATOR') displayName = 'Followers';
      
      if (option === 'SELF_ONLY' && (brandedContent || yourBrand)) {
        return (
          <TooltipProvider key={option}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <SelectItem value={option} disabled className="opacity-50 cursor-not-allowed">
                  {displayName}
                </SelectItem>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-background text-foreground border border-border shadow-md p-2 max-w-[220px] text-wrap text-sm">
                Private visibility cannot be used with content disclosure.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
      
      return (
        <SelectItem key={option} value={option}>{displayName}</SelectItem>
      )
    })
  }
  
  // Function to get disclosure message based on selected options
  const getDisclosureMessage = () => {
    const contentType = isPhoto ? "photo" : "video";
    if (yourBrand && brandedContent) {
      return `Your ${contentType} will be labeled as "Paid partnership".`;
    } else if (yourBrand) {
      return `Your ${contentType} will be labeled as "Promotional content".`;
    } else if (brandedContent) {
      return `Your ${contentType} will be labeled as "Paid partnership".`;
    }
    return null;
  }
  
  // Helper variables for button state and tooltip
  const isDisclosureIncomplete = isDisclosureEnabled && !yourBrand && !brandedContent;
  const isPublishDisabled = 
    isPublishing || 
    isLoading || 
    !selectedAccountId || 
    !title.trim() || 
    !privacyLevel || 
    isDisclosureIncomplete;

  const tooltipMessage = isDisclosureIncomplete 
    ? "You need to indicate if your content promotes yourself, a third party, or both." 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Publish to TikTok</DialogTitle>
          <DialogDescription>
            Share this video directly to your TikTok account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 flex-1 overflow-y-auto custom-scrollbar">
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
            <div className="flex gap-5">
              {/* Left column - Form fields */}
              <div className="max-w-sm space-y-5">
                <div>
                  <p className="text-sm mb-3">
                    Select the TikTok account you want to publish to:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {connectedAccounts.map(account => (
                      <div
                        key={account.id}
                        className={cn(
                          "flex items-center p-3 border rounded-lg cursor-pointer transition-all",
                          selectedAccountId === account.id 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedAccountId(account.id)}
                      >
                        {account.profile_picture ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                            <Image
                              src={account.profile_picture}
                              alt={account.display_name || account.username}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-sm font-medium">
                              {(account.display_name || account.username || "TikTok").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="font-medium">
                            {account.display_name || account.username || "TikTok Account"}
                          </div>
                        </div>
                        {selectedAccountId === account.id && (
                          <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedAccountId && isLoadingCreatorInfo ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Loading settings...</span>
                  </div>
                ) : selectedAccountId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title for your post"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="privacy">Privacy Setting <span className="text-red-500">*</span></Label>
                      <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                        <SelectTrigger id="privacy">
                          <SelectValue placeholder="Select privacy setting" />
                        </SelectTrigger>
                        <SelectContent className="bg-background text-foreground border border-border shadow-md">
                          {renderPrivacyOptions()}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Updated Interaction Settings with horizontal checkboxes */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Allow users to</Label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="allow-comment" 
                            checked={allowComment} 
                            onCheckedChange={(checked) => setAllowComment(!!checked)}
                            disabled={creatorInfo?.disabled_comment_setting}
                            className={cn(
                              creatorInfo?.disabled_comment_setting ? "opacity-50" : ""
                            )}
                          />
                          <Label 
                            htmlFor="allow-comment" 
                            className={cn(
                              "cursor-pointer text-sm",
                              creatorInfo?.disabled_comment_setting ? "opacity-50" : ""
                            )}
                          >
                            Comment
                          </Label>
                        </div>
                        
                        {!isPhoto && (
                          <>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="allow-duet" 
                                checked={allowDuet} 
                                onCheckedChange={(checked) => setAllowDuet(!!checked)}
                                disabled={creatorInfo?.disabled_duet_setting}
                                className={cn(
                                  creatorInfo?.disabled_duet_setting ? "opacity-50" : ""
                                )}
                              />
                              <Label 
                                htmlFor="allow-duet" 
                                className={cn(
                                  "cursor-pointer text-sm",
                                  creatorInfo?.disabled_duet_setting ? "opacity-50" : ""
                                )}
                              >
                                Duet
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="allow-stitch" 
                                checked={allowStitch} 
                                onCheckedChange={(checked) => setAllowStitch(!!checked)}
                                disabled={creatorInfo?.disabled_stitch_setting}
                                className={cn(
                                  creatorInfo?.disabled_stitch_setting ? "opacity-50" : ""
                                )}
                              />
                              <Label 
                                htmlFor="allow-stitch" 
                                className={cn(
                                  "cursor-pointer text-sm",
                                  creatorInfo?.disabled_stitch_setting ? "opacity-50" : ""
                                )}
                              >
                                Stitch
                              </Label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Commercial Content Disclosure Section */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="disclosure" className="text-sm font-medium">Disclose video content</Label>
                        <Switch 
                          id="disclosure" 
                          checked={isDisclosureEnabled} 
                          onCheckedChange={(checked) => {
                            setIsDisclosureEnabled(!!checked)
                            // Reset disclosure options when toggle is turned off
                            if (!checked) {
                              setYourBrand(false)
                              setBrandedContent(false)
                            }
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Turn on to disclose that this {isPhoto ? "photo" : "video"} promotes goods or services in exchange for something of value. 
                        {isDisclosureEnabled ? " Your content could promote yourself, a third party, or both." : ""}
                      </p>
                      
                      {isDisclosureEnabled && (
                        <>
                          {getDisclosureMessage() && (
                            <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start mt-2">
                              <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">!</div>
                              <div>
                                <p className="text-sm text-gray-700">{getDisclosureMessage()}</p>
                                <p className="text-sm text-gray-700">This cannot be changed once your video is posted.</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between py-3 border-b">
                              <div>
                                <h3 className="text-sm font-medium">Your brand</h3>
                                <p className="text-sm text-muted-foreground">
                                  You are promoting yourself or your own business. This content will be classified as Brand Organic.
                                </p>
                              </div>
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={cn({ "cursor-not-allowed": privacyLevel === 'SELF_ONLY' })}>
                                      <Switch 
                                        id="your-brand" 
                                        checked={yourBrand} 
                                        onCheckedChange={(checked) => setYourBrand(!!checked)}
                                        disabled={privacyLevel === 'SELF_ONLY'}
                                        className={cn({ "opacity-50": privacyLevel === 'SELF_ONLY' })}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  {privacyLevel === 'SELF_ONLY' && (
                                    <TooltipContent side="top">
                                      <p>Content disclosure cannot be used when visibility is set to Private.</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <div className="flex items-center justify-between py-3 border-b">
                                  <Label 
                                    htmlFor="branded-content" 
                                    className={cn("flex flex-col space-y-1", {
                                      "text-muted-foreground cursor-not-allowed": privacyLevel === 'SELF_ONLY'
                                    })}
                                  >
                                    <span>Branded content</span>
                                    <span className={cn("font-normal leading-snug", {
                                      "text-muted-foreground": privacyLevel === 'SELF_ONLY'
                                    })}>
                                      You are promoting another brand or a third party. This content will be classified as Branded Content.
                                    </span>
                                  </Label>
                                  <TooltipTrigger asChild>
                                    {/* Wrap Switch in a div for TooltipTrigger when disabled */}
                                    <div className={cn({ "cursor-not-allowed": privacyLevel === 'SELF_ONLY' })}>
                                      <Switch 
                                        id="branded-content" 
                                        checked={brandedContent} 
                                        onCheckedChange={setBrandedContent} 
                                        disabled={privacyLevel === 'SELF_ONLY'}
                                        className={cn({ "opacity-50": privacyLevel === 'SELF_ONLY' })}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                </div>
                                {/* Show tooltip only when disabled specifically due to privacy level */}
                                {privacyLevel === 'SELF_ONLY' && (
                                  <TooltipContent side="top">
                                    <p>Content disclosure cannot be used when visibility is set to Private.</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
                
                {publishSuccess && (
                  <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
                    Video successfully published to TikTok!
                  </div>
                )}
              </div>
              
              {/* Right column - Video preview */}
              <div className="w-40 flex-shrink-0 flex flex-col items-center">
                <div className="sticky top-4">
                  <p className="text-sm text-center mb-2 text-muted-foreground">Preview</p>
                  {!isPhoto ? (
                    <div className="w-40 h-72 overflow-hidden rounded-md bg-black relative shadow-md">
                      <video 
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        src={videoUrl}
                        playsInline
                        muted
                        loop
                        autoPlay
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-72 overflow-hidden rounded-md bg-black relative shadow-md">
                      <Image
                        src={videoUrl}
                        alt="Content preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
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
        
        <DialogFooter className="mt-2 pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground mr-6 max-w-[60%]">
              {brandedContent ? (
                <>
                  By posting, you agree to TikTok's{' '}
                  <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Branded Content Policy
                  </a>{' '}
                  and{' '}
                  <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Music Usage Confirmation
                  </a>
                  .
                </>
              ) : (
                <>
                  By posting, you agree to TikTok's{' '}
                  <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Music Usage Confirmation
                  </a>
                  .
                </>
              )}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {isTikTokEnabled() && !(published === 'tiktok' && publishedUrl) ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className={cn({"cursor-not-allowed": isPublishDisabled})}>
                        <Button 
                          onClick={handlePublish} 
                          disabled={isPublishDisabled}
                          className={cn(
                            "w-full",
                            {"opacity-50 cursor-not-allowed": isPublishDisabled}
                          )}
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
                            </>
                          ) : (
                            "Publish to TikTok"
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {tooltipMessage && (
                      <TooltipContent 
                        side="top" 
                        className="bg-background text-foreground border border-border shadow-md p-2 max-w-[220px] text-wrap text-sm" 
                      >
                        <p>{tooltipMessage}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
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
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
          border: 2px solid transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.5);
        }
        
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
      `}</style>
    </Dialog>
  )
}
