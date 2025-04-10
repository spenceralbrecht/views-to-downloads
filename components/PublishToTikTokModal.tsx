'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog"
import { Loader2, Check, AlertCircle, ExternalLink, Info } from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

// Define the creator info interface based on TikTok API docs
// https://developers.tiktok.com/doc/web-video-kit-post-publish-creator-info-query/
interface CreatorInfo {
  privacy_level_options: string[];
  comment_disabled?: boolean;         // Is commenting disabled by default?
  duet_disabled?: boolean;            // Is duet disabled by default?
  stitch_disabled?: boolean;          // Is stitch disabled by default?
  max_video_post_duration_sec?: number; // Maximum allowed video duration
  posting_unavailability_reason?: string; // Reason why posting might be unavailable (if present, posting is disabled)
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
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const supabase = createClientComponentClient();

  // Post info states
  const [title, setTitle] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState<string>("");
  const [allowComment, setAllowComment] = useState(true); // Default to true
  const [allowDuet, setAllowDuet] = useState(true); // Default to true
  const [allowStitch, setAllowStitch] = useState(true); // Default to true

  // Commercial Content Disclosure states
  const [isDisclosureEnabled, setIsDisclosureEnabled] = useState(false);
  const [yourBrand, setYourBrand] = useState(false); // Promote your own brand
  const [brandedContent, setBrandedContent] = useState(false); // Promote third party brand
  const [disclosurePrompt, setDisclosurePrompt] = useState<string | null>(null); // State for the dynamic prompt

  // Creator info state
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [isLoadingCreatorInfo, setIsLoadingCreatorInfo] = useState(false);

  // Publishing state
  const [publishId, setPublishId] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'fetching_accounts' | 'ready' | 'validating' | 'publishing' | 'sent' | 'processing' | 'published' | 'failed' | 'reauth_required'>('idle');
  const pollingIntervalId = useRef<NodeJS.Timeout | null>(null); // Use ref for interval ID
  const [publishError, setPublishError] = useState<string | null>(null);
  const [finalPublishedUrl, setFinalPublishedUrl] = useState<string | null>(publishedUrl || null); // Store the final URL

  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Utility Functions ---
  const resetForm = () => {
    setTitle("");
    setPrivacyLevel("");
    setAllowComment(true);
    setAllowDuet(true);
    setAllowStitch(true);
    setIsDisclosureEnabled(false);
    setYourBrand(false);
    setBrandedContent(false);
    setPublishId(null);
    setPublishStatus(connectedAccounts.length > 0 ? 'ready' : 'fetching_accounts');
    setPublishError(null);
    setFinalPublishedUrl(publishedUrl || null); // Reset to initial or null
    // Clear any running polls
    if (pollingIntervalId.current) {
      clearInterval(pollingIntervalId.current);
      pollingIntervalId.current = null;
    }
  };

  // --- API Interaction ---

  const checkStatus = async (pId: string, accId: string) => {
    // Ensure polling should continue
    if (!pollingIntervalId.current) return; 

    console.log(`Polling status for publish_id: ${pId}`);
    try {
      const response = await fetch(`/api/tiktok/publish-status?publish_id=${pId}&account_id=${accId}`);
      // No need to check pollingIntervalId.current here again immediately after await
      const result = await response.json();

      // Check again *after* parsing, in case modal closed during fetch/parse
      if (!pollingIntervalId.current) return; 

      if (!response.ok) {
        console.error('Status check failed:', result.error);
        setPublishError(result.error || `Status check failed: ${response.statusText}`);
        setPublishStatus('failed');
         if (result.errorCode === 'REAUTH_REQUIRED') {
            setPublishStatus('reauth_required');
        }
        if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null; // Ensure ref is cleared
        return;
      }

      console.log('Poll Status Response:', result);

      switch (result.status) {
        case 'PUBLISHED':
          setPublishStatus('published');
          // Get username from connectedAccounts state
          const selectedAccount = connectedAccounts.find(acc => acc.id === selectedAccountId);
          const username = selectedAccount?.username || 'user'; // Fallback to 'user'
          const profileUrl = `https://www.tiktok.com/@${username}`;
          // TODO: Get actual video URL if API provides it, otherwise construct a likely one
          const finalUrl = profileUrl; // Replace if TikTok provides video ID/URL in status response
          setFinalPublishedUrl(finalUrl);
          toast({ title: "Success", description: "Video published to TikTok!" });
          if (onPublishSuccess) onPublishSuccess(finalUrl);
          if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
          pollingIntervalId.current = null;
          break;
        case 'FAILED':
          setPublishStatus('failed');
          setPublishError(result.fail_reason || 'Publishing failed for an unknown reason.');
          toast({ title: "Publishing Failed", description: result.fail_reason || 'Please check details and try again.', variant: "destructive" });
          if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
          pollingIntervalId.current = null;
          break;
        case 'PROCESSING':
        case 'PENDING_CONFIRMATION': // Handle other potential in-progress statuses
          setPublishStatus('processing');
          // Continue polling - do nothing here, interval continues
          break;
        default:
          console.warn(`Unknown publish status received: ${result.status}`);
          // Optionally handle as error or keep processing
          setPublishStatus('processing');
      }
    } catch (error: any) {
        // Check if polling is still active before setting state from error
        if (!pollingIntervalId.current) return; 
        console.error('Error during status check fetch:', error);
        setPublishError(error.message || 'Network error during status check.');
        setPublishStatus('failed');
        if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
    }
  };

  const startPollingStatus = (pId: string, accId: string) => {
    if (pollingIntervalId.current) {
      clearInterval(pollingIntervalId.current); // Clear existing interval if any
    }
    setPublishStatus('processing'); // Ensure status is processing
    // Initial check immediately
    checkStatus(pId, accId); 
    // Set up polling interval
    pollingIntervalId.current = setInterval(() => checkStatus(pId, accId), 10000); // Poll every 10 seconds
  };

  const handlePublish = async () => {
    if (!selectedAccountId || !videoUrl) {
      toast({ title: "Error", description: "Please select an account and ensure video URL is valid.", variant: "destructive" });
      return;
    }
    if (!privacyLevel) {
       toast({ title: "Error", description: "Please select a privacy level.", variant: "destructive" });
       return;
    }

    setPublishStatus('publishing');
    setPublishError(null);
    setPublishId(null); // Reset publish ID
    setFinalPublishedUrl(null); // Reset final URL

    const postInfo = {
      title: title || `Video created by Views to Downloads`, // Default title if empty
      privacy_level: privacyLevel,
      disable_comment: !allowComment, // API uses 'disable', UI uses 'allow'
      disable_duet: !allowDuet,
      disable_stitch: !allowStitch,
      is_branded_content: brandedContent, // Promoting third party
      is_brand_organic: yourBrand // Promoting self
    };

    console.log("Publishing to TikTok with:", { accountId: selectedAccountId, videoUrl, postInfo, internalVideoId: videoId });

    try {
      const response = await fetch('/api/tiktok/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccountId,
          videoUrl: videoUrl,
          postInfo: postInfo,
          internalVideoId: videoId // Pass internal ID if available
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Publish API Error:', result);
        setPublishError(result.error || `Publish initiation failed: ${response.statusText}`);
        setPublishStatus('failed');
         if (result.errorCode === 'REAUTH_REQUIRED') {
            setPublishStatus('reauth_required');
        }
        return; // Stop execution if init fails
      }

      // Publish initiated successfully
      console.log('Publish API Success:', result);
      setPublishId(result.publish_id);
      setPublishStatus('sent'); // Indicate request sent, start polling
      startPollingStatus(result.publish_id, selectedAccountId);

    } catch (error: any) {
      console.error('Error publishing to TikTok:', error);
      setPublishError(error.message || 'An unexpected error occurred during publishing.');
      setPublishStatus('failed');
    }
  };


  // --- Effects ---

  // Load connected accounts
  useEffect(() => {
    const loadConnectedAccounts = async () => {
      setPublishStatus('fetching_accounts');
      setIsLoadingAccounts(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch accounts directly using supabase client
          const { data: accounts, error } = await supabase
            .from('connected_accounts')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('provider', 'tiktok'); // Ensure only TikTok accounts

          if (error) throw error;

          setConnectedAccounts(accounts || []);
          if (accounts && accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
            setPublishStatus('ready');
          } else {
            setPublishStatus('idle'); // No accounts, stay idle
          }
        } else {
          setPublishStatus('idle'); // No session
        }
      } catch (error) {
        console.error('Error loading connected accounts:', error);
        setPublishStatus('failed');
        setPublishError('Failed to load connected accounts.');
        toast({ title: "Error", description: "Failed to load connected accounts", variant: "destructive" });
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    if (open) {
      // Reset state before loading
      resetForm(); 
      loadConnectedAccounts();
    } else {
       // Clear interval and reset state fully when modal explicitly closes
       if (pollingIntervalId.current) {
         clearInterval(pollingIntervalId.current);
         pollingIntervalId.current = null;
       }
       resetForm();
       setConnectedAccounts([]);
       setSelectedAccountId("");
       setIsLoadingAccounts(true);
       setCreatorInfo(null);
       setPublishStatus('idle'); // Explicitly set back to idle
    }

    // Cleanup polling interval on unmount
    return () => {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
         pollingIntervalId.current = null;
      }
    };
    // Explicitly depend on `open` to trigger cleanup/reset when it becomes false
  }, [open, supabase]); 

  // Fetch creator info when account changes
  useEffect(() => {
    const fetchAndSetCreatorInfo = async (accountId: string) => {
      if (!accountId) return;

      setIsLoadingCreatorInfo(true);
      try {
         // Mock or fetch basic info needed (like username for URL construction)
         const selectedAccount = connectedAccounts.find(acc => acc.id === accountId);
         if (selectedAccount) {
           const response = await fetch('/api/tiktok/creator-info', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({ accountId }),
           });

           if (!response.ok) {
             const errorData = await response.json();
             console.error('Failed to fetch creator info:', errorData);
             toast({ title: "Error", description: `Failed to get info for ${selectedAccount?.username}: ${errorData.error || 'Unknown error'}`, variant: "destructive" });
             setCreatorInfo(null); // Reset on error
             return;
           }

           const result = await response.json(); 
           console.log('Creator info fetched:', result);
           setCreatorInfo({
             privacy_level_options: result.data.privacy_level_options,
             comment_disabled: result.data.comment_disabled,
             duet_disabled: result.data.duet_disabled,
             stitch_disabled: result.data.stitch_disabled,
             max_video_post_duration_sec: result.data.max_video_post_duration_sec,
           });
         } else {
             setCreatorInfo(null); // Reset if account not found
         }

        // Do NOT reset privacy level here, user might have selected one before info loaded
        // setPrivacyLevel(""); 
      } catch (error) {
        console.error('Error loading creator info:', error);
        // Avoid toast here, less intrusive
        // toast({ title: "Error", description: "Failed to load TikTok creator info", variant: "destructive" });
        setCreatorInfo(null); // Set to null on error
      } finally {
        setIsLoadingCreatorInfo(false);
      }
    };

    if (selectedAccountId) {
      fetchAndSetCreatorInfo(selectedAccountId);
    } else {
        setCreatorInfo(null); // Clear creator info if no account selected
    }
    // Dependency array only needs selectedAccountId now
  }, [selectedAccountId, connectedAccounts]); 

  // Adjust privacy if branded content is selected
  useEffect(() => {
    if (isDisclosureEnabled && brandedContent && privacyLevel === 'SELF_ONLY') {
      setPrivacyLevel('');
      toast({
        title: "Privacy Setting Adjusted",
        description: "Branded content cannot be set to private. Please select a different privacy setting.",
        variant: "default",
      });
    }
  }, [isDisclosureEnabled, brandedContent, privacyLevel]);

  // Effect to handle conflict: Branded Content enabled when Privacy is Private
  useEffect(() => {
    if (isDisclosureEnabled && brandedContent && privacyLevel === 'SELF_ONLY') {
      // Default to Public if available, otherwise the first available option? (Needs refinement if PUBLIC isn't guaranteed)
      const defaultPrivacy = creatorInfo?.privacy_level_options?.includes('PUBLIC_TO_EVERYONE') 
        ? 'PUBLIC_TO_EVERYONE' 
        : creatorInfo?.privacy_level_options?.[0] || ''; // Fallback to first option or empty
      
      if (defaultPrivacy) {
        setPrivacyLevel(defaultPrivacy);
        toast({ 
          title: "Privacy Level Adjusted", 
          description: "Branded content cannot be private. Visibility has been set to Public (or default).",
          variant: "default" // Or 'warning' if available
        });
      }
    }
  }, [isDisclosureEnabled, brandedContent, privacyLevel, creatorInfo?.privacy_level_options]);

  // Effect to update the disclosure prompt text
  useEffect(() => {
    if (!isDisclosureEnabled) {
      setDisclosurePrompt(null);
      return;
    }

    if (brandedContent) { // Covers 'branded only' and 'both'
      setDisclosurePrompt("Your photo/video will be labeled as 'Paid partnership'");
    } else if (yourBrand) { // Covers 'your brand only'
      setDisclosurePrompt("Your photo/video will be labeled as 'Promotional content'");
    } else {
      setDisclosurePrompt(null); // No prompt if neither is selected
    }
  }, [isDisclosureEnabled, yourBrand, brandedContent]);

  // --- Derived State ---
  const isProcessing = ['publishing', 'sent', 'processing'].includes(publishStatus);
  // Allow publishing only if ready, account/privacy selected, not processing, and not already successfully published in this session
  // ADDED: Check for disclosure sub-selection if disclosure is enabled
  const canPublish = 
    selectedAccountId && 
    title.trim() !== '' && 
    privacyLevel &&
    !isProcessing && 
    publishStatus !== 'published' &&
    (!isDisclosureEnabled || (isDisclosureEnabled && (yourBrand || brandedContent))); // Check disclosure selection

  // Determine reason for publish button disablement (for tooltip)
  let publishDisabledReason: string | null = null;
  if (!selectedAccountId) publishDisabledReason = "Please select a TikTok account.";
  else if (!title.trim()) publishDisabledReason = "Please enter a title for your post.";
  else if (!privacyLevel) publishDisabledReason = "Please select a privacy level.";
  else if (isProcessing) publishDisabledReason = "Publishing is currently in progress.";
  else if (publishStatus === 'published') publishDisabledReason = "Already published.";
  else if (isDisclosureEnabled && !yourBrand && !brandedContent) {
    publishDisabledReason = "You need to indicate if your content promotes yourself, a third party, or both.";
  }

  const showSuccessMessage = publishStatus === 'published' && !!finalPublishedUrl;
  const showErrorMessage = (publishStatus === 'failed' || publishStatus === 'reauth_required') && !!publishError;

  // Determine the confirmation text based on disclosure settings
  let confirmationText = "By posting, you agree to TikTok's Music Usage Confirmation.";
  if (isDisclosureEnabled && brandedContent) {
    confirmationText = "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation.";
  }

  // --- Render Logic ---
  const renderStatusMessage = () => {
    if (showSuccessMessage) {
      return (
        <Alert variant="default" className="mt-4 bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Published Successfully!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Your video is live on TikTok.
            {finalPublishedUrl && finalPublishedUrl.startsWith('http') ? (
              <a href={finalPublishedUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                View on TikTok <ExternalLink className="inline h-3 w-3" />
              </a>
            ) : (
              <span className="ml-2 text-sm">(View link unavailable)</span>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    if (showErrorMessage) {
       const isReauth = publishStatus === 'reauth_required';
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{isReauth ? "Authentication Required" : "Publishing Failed"}</AlertTitle>
          <AlertDescription>
             {publishError}
             {isReauth && " Please reconnect your TikTok account from settings."}
          </AlertDescription>
        </Alert>
      );
    }
     if (publishStatus === 'processing') {
       return (
         <Alert variant="default" className="mt-4 bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700">
           <Loader2 className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
           <AlertTitle className="text-yellow-800 dark:text-yellow-200">Processing Video</AlertTitle>
           <AlertDescription className="text-yellow-700 dark:text-yellow-300">
             TikTok is processing your video. This may take a few moments. Status is being checked automatically...
           </AlertDescription>
         </Alert>
       );
     }
    if (publishStatus === 'sent') {
      return (
        <Alert variant="default" className="mt-4 bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Sent to TikTok</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Video sent for processing. Waiting for status updates...
          </AlertDescription>
        </Alert>
      );
    }
    if (publishStatus === 'publishing') {
      return (
        <Alert variant="default" className="mt-4 bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Publishing...</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
             Initiating publish request with TikTok...
          </AlertDescription>
        </Alert>
      );
    }
    return null; // No message for idle, ready, fetching states unless desired
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       {/* Keep rest of JSX, ensure button disabled logic uses `isProcessing` and `!canPublish` */}
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
         <DialogHeader>
           <DialogTitle>Publish to TikTok</DialogTitle>
         </DialogHeader>

         {renderStatusMessage()}

         {/* Only show form if not successfully published */}
         {!showSuccessMessage && (
           <div className="grid gap-4 py-4">
             {/* Account Selection */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="tiktok-account" className="text-right">
                 Account
               </Label>
               {isLoadingAccounts ? (
                 <div className="col-span-3 flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading accounts...
                 </div>
               ) : connectedAccounts.length > 0 ? (
                 <Select
                   value={selectedAccountId}
                   onValueChange={setSelectedAccountId}
                   disabled={isProcessing || showSuccessMessage || isLoadingAccounts}
                 >
                   <SelectTrigger className="col-span-3">
                     <SelectValue placeholder="Select TikTok Account" />
                   </SelectTrigger>
                   <SelectContent>
                     {connectedAccounts.map((account) => (
                       <SelectItem key={account.id} value={account.id}>
                         @{account.username || account.provider_account_id}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               ) : (
                  <div className="col-span-3 text-sm text-muted-foreground">
                    No TikTok accounts connected. Please connect one in settings.
                  </div>
               )}
             </div>

              {/* Video Preview (Optional) */}
             {videoUrl && !isPhoto && (
                <div className="grid grid-cols-4 items-start gap-4">
                   <Label className="text-right pt-2">Preview</Label>
                   <div className="col-span-3">
                       <video
                          ref={videoRef}
                          controls
                          preload="metadata"
                          className="w-full rounded-md bg-muted"
                          style={{ maxHeight: '200px' }}
                        >
                          <source src={videoUrl} type="video/mp4" /> {/* Adjust type if needed */}
                          Your browser does not support the video tag.
                        </video>
                   </div>
                </div>
              )}

             {/* Post Title */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="title" className="text-right">
                 Title (Optional)
               </Label>
               <Input
                 id="title"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="col-span-3"
                 placeholder="Add a catchy title..."
                 disabled={isProcessing || showSuccessMessage}
                 maxLength={150} // TikTok title limit
               />
             </div>

             {/* Privacy Level */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="privacy-level" className="text-right">
                 Who can view *
               </Label>
               <Select
                 value={privacyLevel}
                 onValueChange={setPrivacyLevel}
                 disabled={isProcessing || showSuccessMessage || isLoadingCreatorInfo || !selectedAccountId}
               >
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Select privacy level..." />
                 </SelectTrigger>
                 <SelectContent>
                   {creatorInfo?.privacy_level_options?.map((option) => {
                     const isPrivateOption = option === 'SELF_ONLY';
                     const isDisabled = isPrivateOption && isDisclosureEnabled && brandedContent;

                     return (
                       <TooltipProvider key={option} delayDuration={100}>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             {/* Wrap SelectItem in a span for tooltip on disabled item */} 
                             <span style={{ display: 'block', cursor: isDisabled ? 'not-allowed' : 'pointer' }}> 
                               <SelectItem 
                                 value={option} 
                                 disabled={isDisabled}
                                 // Apply style directly if needed to indicate disabled state visually
                                 // style={isDisabled ? { pointerEvents: 'none', opacity: 0.5 } : {}} 
                                 className={isDisabled ? 'text-muted-foreground' : ''}
                               >
                                 {/* Format option for display */} 
                                 {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                               </SelectItem>
                             </span>
                           </TooltipTrigger>
                           {isDisabled && (
                             <TooltipContent>
                               <p>Branded content visibility cannot be set to private.</p>
                             </TooltipContent>
                           )}
                         </Tooltip>
                       </TooltipProvider>
                     );
                   })}
                 </SelectContent>
               </Select>
             </div>

             {/* Allow Settings */}
             <div className="grid grid-cols-4 items-start gap-4">
               <Label className="text-right pt-2">Allow users to:</Label>
               <div className="col-span-3 space-y-2">
                 <div className="flex items-center space-x-2">
                   <Checkbox
                     id="allow-comment"
                     checked={allowComment}
                     onCheckedChange={(checked) => setAllowComment(Boolean(checked))}
                     disabled={isProcessing || showSuccessMessage || !!creatorInfo?.comment_disabled}
                   />
                   <Label htmlFor="allow-comment" className="font-normal">Comment</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Checkbox
                     id="allow-duet"
                     checked={allowDuet}
                     onCheckedChange={(checked) => setAllowDuet(Boolean(checked))}
                      disabled={isProcessing || showSuccessMessage || !!creatorInfo?.duet_disabled}
                   />
                   <Label htmlFor="allow-duet" className="font-normal">Duet</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Checkbox
                     id="allow-stitch"
                     checked={allowStitch}
                     onCheckedChange={(checked) => setAllowStitch(Boolean(checked))}
                     disabled={isProcessing || showSuccessMessage || !!creatorInfo?.stitch_disabled}
                   />
                   <Label htmlFor="allow-stitch" className="font-normal">Stitch</Label>
                 </div>
               </div>
             </div>

              {/* Commercial Content Disclosure */}
              <div className="grid grid-cols-4 items-start gap-4 border-t pt-4">
                <Label className="text-right pt-2 flex flex-col">
                    <span>Content Disclosure</span>
                    <span className="text-xs text-muted-foreground">(Required if applicable)</span>
                </Label>
                <div className="col-span-3 space-y-3">
                   <div className="flex items-center justify-between">
                      <Label htmlFor="disclosure-switch" className="font-normal flex items-center">
                          Disclose post content
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Turn this on if your post promotes a brand, product, or service.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      </Label>
                      <Switch
                        id="disclosure-switch"
                        checked={isDisclosureEnabled}
                        onCheckedChange={setIsDisclosureEnabled}
                        disabled={isProcessing || showSuccessMessage}
                      />
                   </div>
                    {isDisclosureEnabled && (
                      <div className="pl-4 border-l-2 space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">Select the type of promotion:</p>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="your-brand"
                            checked={yourBrand}
                            onCheckedChange={(checked) => setYourBrand(Boolean(checked))}
                            disabled={isProcessing || showSuccessMessage}
                          />
                          <Label htmlFor="your-brand" className="font-normal">Your brand</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Promoting your own business, products, or services.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="branded-content"
                            checked={brandedContent}
                            onCheckedChange={(checked) => setBrandedContent(Boolean(checked))}
                            disabled={isProcessing || showSuccessMessage}
                          />
                          <Label htmlFor="branded-content" className="font-normal">Branded content</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Promoting a third party's brand, product, or service for compensation.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    )}
                </div>
              </div>
           </div>
         )}

         <DialogFooter>
            {/* Display confirmation text based on disclosure settings */}
            <p className="text-xs text-muted-foreground mr-auto pr-4">
              {confirmationText}
            </p>

            {/* Close button behavior depends on state */}
            <DialogClose asChild>
              <Button variant="outline" disabled={isProcessing && publishStatus !== 'failed' && publishStatus !== 'reauth_required'}>
                {showSuccessMessage ? 'Close' : 'Cancel'}
              </Button>
            </DialogClose>
           {/* Show publish button only if not successfully published */}
           {!showSuccessMessage && (
             <TooltipProvider delayDuration={100}>
               <Tooltip>
                 <TooltipTrigger asChild>
                   {/* Wrap button in span for tooltip when disabled */}
                   <span style={{ display: 'inline-block', cursor: !canPublish ? 'not-allowed' : 'pointer' }}>
                     <Button
                       onClick={handlePublish}
                       disabled={!canPublish}
                       style={!canPublish ? { pointerEvents: 'none' } : {}} // Ensure button isn't clickable when disabled wrapper is used
                     >
                       {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                       {publishStatus === 'published' ? 'Published' : isProcessing ? 'Publishing...' : 'Publish'}
                     </Button>
                   </span>
                 </TooltipTrigger>
                 {publishDisabledReason && (
                   <TooltipContent>
                     <p>{publishDisabledReason}</p>
                   </TooltipContent>
                 )}
               </Tooltip>
             </TooltipProvider>
           )}
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
}

// Keep type definitions or move them if appropriate
