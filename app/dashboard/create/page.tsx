'use client'

import { useState, useEffect, useTransition, useMemo, memo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, X, HelpCircle, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { uploadDemoVideo, createVideo, generateVideoPromptServer } from '../actions'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { VideoCard } from '@/components/VideoCard'
import { AppSelect } from '@/components/app-select'
import { useUser } from '@supabase/auth-helpers-react'
import { useSubscription } from '@/hooks/useSubscription'
import type { DemoVideo, OutputVideo } from '@/app/types'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { ContentLimitGuard } from '@/components/ContentLimitGuard'
import { incrementContentUsage } from '@/utils/subscription'
import { useToast } from "@/components/ui/use-toast"
import { UpgradeModal } from '@/components/upgrade-modal'
import Link from 'next/link'
import type { OutputContent } from '@/types/video'
import { getInfluencerVidsWithTags, findVideosByTags } from '@/utils/influencerVideos'
import { InfluencerVidWithTags, Tag } from '@/types/database'
import FilterTags from '@/components/FilterTags'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DemoVideoCardSkeleton } from '@/components/DemoVideoCardSkeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ViralFormatModal } from '@/components/ViralFormatModal'
import { InfluencerTabs } from '@/components/InfluencerTabs'
import Image from 'next/image'
import { fal } from "@fal-ai/client";

interface Hook {
  id: string
  hook_text: string
}

// Initialize fal client with proper key
fal.config({
  credentials: process.env.NEXT_PUBLIC_FAL_KEY || ''
});

// Log initialization status to help with debugging
const falApiKey = process.env.NEXT_PUBLIC_FAL_KEY;
console.log('🔍 [FAL-CONFIG] API key status:', falApiKey ? `Present (length: ${falApiKey.length})` : 'Missing');
if (!falApiKey) {
  console.error('🔍 [FAL-CONFIG] WARNING: Fal API key is missing or empty! Check your .env.local file.');
  console.error('🔍 [FAL-CONFIG] Expected environment variable: NEXT_PUBLIC_FAL_KEY');
}

// Get UGC video URL (from Cloudflare R2)
const getUGCVideoUrl = (videoNumber: number | null) => {
  if (!videoNumber) return ''
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  const url = `${baseUrl}/${videoNumber}.mp4`
  return url
}

// Get UGC thumbnail URL (from Cloudflare R2)
const getUGCThumbnailUrl = (videoNumber: number | null) => {
  if (!videoNumber) return ''
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  return `${baseUrl}/thumbnail-${videoNumber}.png`
}

// Get demo video URL
const getDemoVideoUrl = (path: string) => {
  if (!path) return ''
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  return `${baseUrl}/demos/${path}`
}

// Get output video URL
const getOutputVideoUrl = (path: string) => {
  if (!path) return ''
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  return `${baseUrl}/output/${path}`
}

// Generate a prompt for the video based on the hook using OpenAI
const generateVideoPrompt = async (hook: string): Promise<string> => {
  try {
    console.log('📝 [CLIENT-DEBUG] Starting video prompt generation');
    console.log('📝 [CLIENT-DEBUG] Hook text:', hook);
    
    console.log('📝 [CLIENT-DEBUG] Calling server action for prompt generation');
    const result = await generateVideoPromptServer(hook);
    
    console.log('📝 [CLIENT-DEBUG] Server action completed');
    console.log('📝 [CLIENT-DEBUG] Generated video prompt:', result.prompt);
    
    return result.prompt;
  } catch (error) {
    console.error('📝 [CLIENT-DEBUG] Error generating video prompt:', error);
    return "Person with neutral expression, slight head movement and blinking";
  }
};

// Generate a video from a static image using Fal AI
const generateVideoFromImage = async (imageUrl: string, prompt: string): Promise<string> => {
  try {
    console.log('🔍 [FAL-DEBUG] ======= STARTING FAL API VIDEO GENERATION =======');
    console.log('🔍 [FAL-DEBUG] Starting video generation from static image');
    console.log('🔍 [FAL-DEBUG] Full Image URL:', imageUrl);
    console.log('🔍 [FAL-DEBUG] Animation prompt:', prompt);
    
    // Verify API key is present first
    const apiKey = process.env.NEXT_PUBLIC_FAL_KEY;
    if (!apiKey) {
      throw new Error('Fal API key is missing. Please add NEXT_PUBLIC_FAL_KEY to your .env.local file.');
    }
    
    console.log('🔍 [FAL-DEBUG] Initializing Fal API call with image-to-video model');
    console.log('🔍 [FAL-DEBUG] Request payload:', JSON.stringify({
      input: {
        prompt,
        image_url: imageUrl
      }
    }, null, 2));
    
    // Start the request and get a requestId
    console.log('🔍 [FAL-DEBUG] Submitting request to Fal API...');
    
    try {
      const initialResponse = await fal.queue.submit("fal-ai/veo2/image-to-video", {
        input: {
          prompt,
          image_url: imageUrl
        }
      });
      
      const requestId = initialResponse.request_id;
      console.log('🔍 [FAL-DEBUG] Request submitted with ID:', requestId);
      
      // Poll for status until complete
      let status = "PENDING";
      let attempts = 0;
      const maxAttempts = 30; // Limit the number of attempts
      const pollingInterval = 2000; // 2 seconds between checks
      
      console.log('🔍 [FAL-DEBUG] Starting to poll for request status');
      
      while (status !== "COMPLETED" && status !== "FAILED" && attempts < maxAttempts) {
        attempts++;
        
        // Wait for the polling interval
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        // Check status
        try {
          const statusResponse = await fal.queue.status("fal-ai/veo2/image-to-video", {
            requestId: requestId
          });
          
          status = statusResponse.status;
          console.log(`🔍 [FAL-DEBUG] Poll attempt ${attempts}/${maxAttempts}: Status: ${status}`);
          console.log('🔍 [FAL-DEBUG] Status details:', JSON.stringify(statusResponse, null, 2));
          
          // If there are logs, print them (with type safety)
          if (statusResponse && typeof statusResponse === 'object' && 'logs' in statusResponse && Array.isArray(statusResponse.logs)) {
            statusResponse.logs.forEach((log: any) => {
              if (log && typeof log === 'object' && 'message' in log) {
                console.log(`🔍 [FAL-DEBUG] Processing log: ${log.message}`);
              }
            });
          }
        } catch (statusError) {
          console.error('🔍 [FAL-DEBUG] Error checking status:', statusError);
          // Continue polling despite status check error
        }
      }
      
      if (status !== "COMPLETED") {
        console.error('🔍 [FAL-DEBUG] Request did not complete successfully:', status);
        throw new Error(`Request did not complete successfully. Final status: ${status}`);
      }
      
      // Fetch the final result using the requestId
      console.log('🔍 [FAL-DEBUG] Request completed. Fetching final result...');
      const result = await fal.queue.result("fal-ai/veo2/image-to-video", {
        requestId: requestId
      });
      
      // Access the result data and log it in full
      console.log('🔍 [FAL-DEBUG] ======= FAL API RESPONSE RECEIVED =======');
      console.log('🔍 [FAL-DEBUG] Full response data:', JSON.stringify(result.data, null, 2));
      console.log('🔍 [FAL-DEBUG] Response request ID:', result.requestId);
      
      // Use type assertion to access the data structure
      // This is necessary because the FAL AI types might not reflect the actual response
      const responseData = result.data as any;
      console.log('🔍 [FAL-DEBUG] Response data type:', typeof responseData);
      console.log('🔍 [FAL-DEBUG] Response data keys:', Object.keys(responseData));
      
      let videoUrl = "";
      
      // Based on the observed response structure in the logs
      // The video URL is in responseData.video.url
      if (responseData.video && responseData.video.url) {
        videoUrl = responseData.video.url;
        console.log('🔍 [FAL-DEBUG] Found video URL in responseData.video.url:', videoUrl);
      }
      // Try additional paths based on the Fal AI documentation
      else if (responseData.videos && responseData.videos.length > 0) {
        videoUrl = responseData.videos[0];
        console.log('🔍 [FAL-DEBUG] Found video URL in responseData.videos[0]:', videoUrl);
      } else if (responseData.video_url) {
        videoUrl = responseData.video_url;
        console.log('🔍 [FAL-DEBUG] Found video URL in responseData.video_url:', videoUrl);
      } else if (responseData.output && responseData.output.video) {
        videoUrl = responseData.output.video;
        console.log('🔍 [FAL-DEBUG] Found video URL in responseData.output.video:', videoUrl);
      } else if (responseData.video_urls && responseData.video_urls.length > 0) {
        videoUrl = responseData.video_urls[0];
        console.log('🔍 [FAL-DEBUG] Found video URL in responseData.video_urls[0]:', videoUrl);
      }
      
      if (!videoUrl) {
        console.error('🔍 [FAL-DEBUG] No video URL found in the response:', responseData);
        
        // Try to extract deeper nested structures that might contain the URL
        // This is a deeper inspection of the response object
        if (typeof responseData === 'object') {
          const flattenedPaths: Record<string, string> = {};
          
          // Function to recursively scan the object for potential URL paths
          const findPaths = (obj: any, path: string = '') => {
            if (!obj || typeof obj !== 'object') return;
            
            Object.entries(obj).forEach(([key, value]) => {
              const currentPath = path ? `${path}.${key}` : key;
              
              // Check if this value looks like a URL
              if (typeof value === 'string' && 
                  (value.startsWith('http://') || value.startsWith('https://')) &&
                  (value.endsWith('.mp4') || value.includes('video'))) {
                flattenedPaths[currentPath] = value;
                console.log(`🔍 [FAL-DEBUG] Found potential video URL at path ${currentPath}:`, value);
              }
              
              // Recursively search nested objects
              if (value && typeof value === 'object') {
                findPaths(value, currentPath);
              }
            });
          };
          
          // Scan the response for URLs
          findPaths(responseData);
          
          // If we found any URLs, use the first one
          const urlPaths = Object.keys(flattenedPaths);
          if (urlPaths.length > 0) {
            videoUrl = flattenedPaths[urlPaths[0]];
            console.log(`🔍 [FAL-DEBUG] Using URL found at path ${urlPaths[0]}:`, videoUrl);
          }
        }
        
        // If we still don't have a URL, throw an error
        if (!videoUrl) {
          throw new Error('No video URL found in the response');
        }
      }
      
      console.log('🔍 [FAL-DEBUG] Generated video URL:', videoUrl);
      
      // Validate the video URL by checking if it's accessible
      console.log('🔍 [FAL-DEBUG] Validating video URL is accessible...');
      try {
        const videoCheck = await fetch(videoUrl, { method: 'HEAD' });
        console.log(`🔍 [FAL-DEBUG] Video URL validation status: ${videoCheck.status}`);
        if (!videoCheck.ok) {
          console.error(`🔍 [FAL-DEBUG] Video URL validation failed: ${videoCheck.status}`);
          throw new Error(`Video URL validation failed: ${videoCheck.status}`);
        }
        console.log('🔍 [FAL-DEBUG] Video URL validated successfully');
      } catch (validationError) {
        console.error('🔍 [FAL-DEBUG] Error validating video URL:', validationError);
        // Continue anyway, as some URLs might not support HEAD requests
      }
      
      console.log('🔍 [FAL-DEBUG] ======= FAL API VIDEO GENERATION COMPLETED SUCCESSFULLY =======');
      return videoUrl;
    } catch (falApiError: any) {
      // Handle Fal API specific errors
      console.error('🔍 [FAL-DEBUG] Fal API error:', falApiError);
      if (falApiError.status === 401) {
        throw new Error('Authentication failed with Fal API. Please check your API key.');
      } else if (falApiError.message) {
        throw new Error(`Fal API error: ${falApiError.message}`);
      } else {
        throw falApiError; // Re-throw if we can't add any helpful context
      }
    }
  } catch (error: any) {
    console.error('🔍 [FAL-DEBUG] ======= FAL API VIDEO GENERATION FAILED =======');
    console.error('🔍 [FAL-DEBUG] Error generating video from image:', error);
    
    // Return a formatted error for better UX
    const errorMessage = error.message || 'Unknown error during video generation';
    throw new Error(`Fal AI video generation failed: ${errorMessage}`);
  }
};

export default function CreateAd() {
  const supabase = createClientComponentClient()
  const [isPending, startTransition] = useTransition()
  const user = useUser()
  const { isSubscribed, contentRemaining, subscription, loading } = useSubscription(user)
  const { toast } = useToast()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isViralFormatModalOpen, setIsViralFormatModalOpen] = useState(false)

  // State for app selection
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [apps, setApps] = useState<{ id: string; app_store_url: string; app_name: string; app_logo_url: string; created_at: string }[]>([])
  const [loadingApps, setLoadingApps] = useState(true)

  // State for hooks
  const [hooks, setHooks] = useState<Hook[]>([])
  const [currentHookIndex, setCurrentHookIndex] = useState(0)
  const [loadingHooks, setLoadingHooks] = useState(false)
  const [hook, setHook] = useState('')
  const [textPosition, setTextPosition] = useState<'top' | 'middle' | 'bottom'>('bottom')

  // Update hook text when index changes or hooks array changes
  useEffect(() => {
    if (hooks.length > 0 && currentHookIndex >= 0 && currentHookIndex < hooks.length) {
      setHook(hooks[currentHookIndex].hook_text)
    } else if (hooks.length === 0) {
      // Clear hook text when no hooks are available
      setHook('')
    }
  }, [currentHookIndex, hooks])

  const handlePrevHook = () => {
    setCurrentHookIndex((i) => (i > 0 ? i - 1 : hooks.length - 1))
  }

  const handleNextHook = () => {
    setCurrentHookIndex((i) => (i < hooks.length - 1 ? i + 1 : 0))
  }

  // State for video selection
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedInfluencerVideo, setSelectedInfluencerVideo] = useState('')
  const [selectedDemoVideo, setSelectedDemoVideo] = useState('')
  const [selectedDemo, setSelectedDemo] = useState<string>('')
  const [isCustomInfluencer, setIsCustomInfluencer] = useState(false)

  // State for demo videos
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([])
  const [loadingDemos, setLoadingDemos] = useState(false)

  // State for influencer videos
  const [influencerVideos, setInfluencerVideos] = useState<InfluencerVidWithTags[]>([])
  const [filteredInfluencerVideos, setFilteredInfluencerVideos] = useState<InfluencerVidWithTags[]>([])
  const [loadingInfluencerVideos, setLoadingInfluencerVideos] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'your' | 'base'>('base')

  // Pagination setup for the influencer videos
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 24
  const totalPages = Math.ceil(filteredInfluencerVideos.length / pageSize)
  
  // Add logging for pagination
  useEffect(() => {
    console.log('Current influencer videos state:', influencerVideos.length)
    console.log('Total pages:', totalPages)
    console.log('Current page:', currentPage)
  }, [influencerVideos, totalPages, currentPage])
  
  const handlePrev = () => {
    console.log('Navigating to previous page')
    setCurrentPage((page) => (page > 1 ? page - 1 : page))
  }
  
  const handleNext = () => {
    console.log('Navigating to next page')
    setCurrentPage((page) => (page < totalPages ? page + 1 : page))
  }
  
  // Memoize the videos array so it doesn't change when hook changes
  const paginatedInfluencerVideos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const videos = filteredInfluencerVideos?.slice(startIndex, endIndex) || []
    console.log('Videos to show for current page:', {
      page: currentPage,
      startIndex,
      endIndex,
      pageSize,
      numberOfVideos: videos.length
    })
    return videos
  }, [currentPage, pageSize, filteredInfluencerVideos])

  // Filter videos when selected tags change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    
    if (selectedTags.length === 0) {
      // No filters, show all videos
      setFilteredInfluencerVideos(influencerVideos);
    } else {
      // Filter videos that have at least one of the selected tags
      const filtered = influencerVideos.filter(video => {
        return video.tags.some(tag => selectedTags.includes(tag.id));
      });
      setFilteredInfluencerVideos(filtered);
    }
  }, [selectedTags, influencerVideos]);

  // Handle tag selection changes
  const handleTagsChange = (tags: string[]) => {
    console.log('Tags changed:', tags);
    setSelectedTags(tags);
  };

  // Extract unique tags from all videos
  const uniqueTags = useMemo(() => {
    const tagMap = new Map();
    
    influencerVideos.forEach(video => {
      video.tags.forEach(tag => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    
    return Array.from(tagMap.values());
  }, [influencerVideos]);

  // State for output videos
  const [outputVideos, setOutputVideos] = useState<OutputVideo[]>([])
  const [loadingOutputVideos, setLoadingOutputVideos] = useState(false)

  // Check if Fal API key is configured on page load
  useEffect(() => {
    const falApiKey = process.env.NEXT_PUBLIC_FAL_KEY;
    if (!falApiKey) {
      console.error('🔍 [FAL-CONFIG] Fal API key missing - showing warning toast');
      toast({
        title: "Animation Service Unavailable",
        description: "Custom influencer animation is disabled. Please check your API configuration.",
        variant: "destructive",
        duration: 6000,
      });
    }
  }, [toast]);

  // Move randomization to a state that's set only once on mount
  const [allVideos, setAllVideos] = useState<number[]>([])

  // Initialize videos once on mount
  useEffect(() => {
    const totalVideos = parseInt(process.env.NEXT_PUBLIC_TOTAL_VIDEOS || '59');
    console.log('Initializing videos with total count:', totalVideos);
    
    // Create array from 1 to totalVideos and randomize it
    const videos = Array.from({ length: totalVideos }, (_, i) => i + 1);
    console.log('Original video array:', videos);
    
    // Use a more stable randomization that we can track
    const randomizedVideos = [...videos].sort(() => Math.random() - 0.5);
    console.log('Randomized video array:', randomizedVideos);
    
    setAllVideos(randomizedVideos);
  }, []) // Empty dependency array means this runs once on mount

  // Function to fetch demo videos
  const fetchDemoVideos = async () => {
    setLoadingDemos(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        setLoadingDemos(false);
        return;
      }

      // IMPORTANT: Store the app ID we're using for this fetch to ensure consistency
      const appIdForFetch = selectedAppId;
      console.log('Fetching demo videos for app ID:', appIdForFetch || 'all apps');

      const query = supabase
        .from('input_content')
        .select('*')
        .eq('user_id', user.id);

      // If an app is selected, filter by app_id
      if (appIdForFetch) {
        query.eq('app_id', appIdForFetch);
      }

      // Log the query we're about to execute
      console.log('Fetching demo videos with query:', {
        user_id: user.id,
        app_id: appIdForFetch || 'not filtered'
      });

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching demo videos:', error);
        toast({
          title: "Error Loading Demos",
          description: "Could not load your demo videos. Please try refreshing the page.",
          variant: "destructive"
        });
      } else if (data) {
        console.log('Fetched demo videos:', data.length ? `${data.length} videos` : 'No videos found');
        
        if (data.length === 0) {
          console.log('No demo videos found for query:', {
            user_id: user.id,
            app_id: appIdForFetch || 'not filtered'
          });
        }
        
        // Process the videos in batches to avoid overwhelming the browser
        const processVideosInBatches = async (videos: any[], batchSize = 5) => {
          const results = [];
          for (let i = 0; i < videos.length; i += batchSize) {
            const batch = videos.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(async (video: any) => {
              // Get the public URL for the full path including user ID
              const { data: publicData } = supabase
                .storage
                .from('input-content')
                .getPublicUrl(video.content_url);
                
              // We'll skip the file existence check for performance reasons
              return { 
                ...video, 
                publicUrl: publicData.publicUrl,
                isLoading: false,
                uploadProgress: undefined
              };
            }));
            results.push(...batchResults);
          }
          return results;
        };
        
        const demoVideosWithUrls = await processVideosInBatches(data);
        
        // Check if we already have any of these videos in our state
        // This helps prevent the "video not found" error when a video was just uploaded
        const currentVideos = demoVideosWithUrls.map(video => video.id);
        const existingVideos = demoVideos.filter(video => currentVideos.includes(video.id));
        
        console.log(`Found ${existingVideos.length} videos that are already in state`);
        
        // Only update state if the app ID hasn't changed during the fetch
        if (appIdForFetch === selectedAppId) {
          console.log('Setting demo videos state with', demoVideosWithUrls.length, 'videos');
          
          // Preserve any videos that were just uploaded but might not be in the database yet
          const justUploadedVideos = demoVideos.filter(video => 
            !currentVideos.includes(video.id) && 
            video.created_at && 
            new Date(video.created_at).getTime() > Date.now() - 10000 // Videos uploaded in the last 10 seconds
          );
          
          if (justUploadedVideos.length > 0) {
            console.log('Preserving recently uploaded videos:', justUploadedVideos.length);
            setDemoVideos([...justUploadedVideos, ...demoVideosWithUrls]);
          } else {
            setDemoVideos(demoVideosWithUrls);
          }
          
          // If we have a newly uploaded video, select it automatically
          if (demoVideosWithUrls.length > 0 && isUploading === false && uploadingFile !== null) {
            const latestVideo = demoVideosWithUrls[0];
            if (latestVideo.publicUrl) {
              setSelectedDemoVideo(latestVideo.publicUrl);
            }
            setUploadingFile(null); // Clear the uploading file reference
          }
        } else {
          console.warn('App ID changed during fetch, discarding results');
        }
      }
    } catch (error: any) {
      console.error('Error in fetchDemoVideos:', error);
      toast({
        title: "Error Loading Demos",
        description: "Could not load your demo videos. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoadingDemos(false);
    }
    
    // Return a promise that resolves when the function completes
    return Promise.resolve();
  };

  // Call fetchDemoVideos on mount and when selectedAppId changes
  useEffect(() => {
    if (selectedAppId) {
      console.log('App ID changed, fetching demo videos for:', selectedAppId);
      fetchDemoVideos();
    }
  }, [selectedAppId]); // Dependency on selectedAppId ensures we refetch when it changes

  // Fetch apps
  useEffect(() => {
    async function fetchApps() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('apps')
        .select('id, app_store_url, app_name, app_logo_url, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching apps:', error)
      } else if (data && data.length > 0) {
        setApps(data)
        // Set the first app as default if no app is selected
        if (!selectedAppId) {
          setSelectedAppId(data[0].id)
          // We'll fetch demo videos when selectedAppId changes via the other useEffect
        }
      } else {
        // No apps found
        console.log('No apps found for user');
        setShowNoAppsDialog(true);
      }
      setLoadingApps(false)
    }
    fetchApps()
  }, [supabase, selectedAppId])

  // Function to fetch output videos
  const fetchOutputVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: videos, error } = await supabase
      .from('output_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching output videos:', error);
      return;
    }
    const outputVideosWithUrls = (videos || []).map((video) => {
      if (!video || !video.url) {
        console.warn('Video or URL is missing:', video);
        return { ...video, url: '' };
      }
      try {
        const videoPath = video.url.includes('output-content/')
          ? video.url.split('output-content/')[1]
          : video.url;
        const { data: { publicUrl } } = supabase
          .storage
          .from('output-content')
          .getPublicUrl(videoPath);
        return { ...video, url: publicUrl };
      } catch (error) {
        console.error('Error processing video URL:', error, video);
        return { ...video, url: '' };
      }
    });
    setOutputVideos(outputVideosWithUrls.filter(video => video !== null));
    setLoadingOutputVideos(false);
  };

  // Add real-time subscription for video status updates
  useEffect(() => {
    const channel = supabase
      .channel('output_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'output_content'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setOutputVideos(currentVideos => 
              currentVideos.map(video => {
                if (video.id === payload.new.id) {
                  const newVideo = payload.new;
                  if (!newVideo.url) return { ...video, ...newVideo };
                  try {
                    const videoPath = newVideo.url.includes('output-content/')
                      ? newVideo.url.split('output-content/')[1]
                      : newVideo.url;
                    const { data: { publicUrl } } = supabase
                      .storage
                      .from('output-content')
                      .getPublicUrl(videoPath);
                    return { ...video, ...newVideo, url: publicUrl };
                  } catch (error) {
                    console.error('Error processing updated video URL:', error);
                    return { ...video, ...newVideo };
                  }
                }
                return video;
              })
            );
          } else if (payload.eventType === 'INSERT') {
            const newVideo = payload.new as OutputContent;
            if (!newVideo.url) {
              setOutputVideos(currentVideos => [newVideo, ...currentVideos]);
              return;
            }
            try {
              const videoPath = newVideo.url.includes('output-content/')
                ? newVideo.url.split('output-content/')[1]
                : newVideo.url;
              const { data: { publicUrl } } = supabase
                .storage
                .from('output-content')
                .getPublicUrl(videoPath);
              setOutputVideos(currentVideos => [{ ...newVideo, url: publicUrl }, ...currentVideos]);
            } catch (error) {
              console.error('Error processing new video URL:', error);
              setOutputVideos(currentVideos => [newVideo, ...currentVideos]);
            }
          } else if (payload.eventType === 'DELETE') {
            setOutputVideos(currentVideos => 
              currentVideos.filter(video => video.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    fetchOutputVideos();
  }, [supabase]);

  // Fetch hooks when app is selected
  useEffect(() => {
    async function fetchHooks() {
      if (!selectedAppId) {
        setHooks([])
        setHook('')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setLoadingHooks(true)
      const { data, error } = await supabase
        .from('hooks')
        .select('*')
        .eq('app_id', selectedAppId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching hooks:', error)
        toast({
          title: "Error Loading Hooks",
          description: `Error code: ${error.code}. Please report this error: ${error.message}`,
          variant: "destructive"
        })
      } else if (data) {
        setHooks(data)
        if (data.length > 0) {
          setHook(data[0].hook_text)
          setCurrentHookIndex(0)
        } else {
          // No hooks found for the selected app
          console.log('No hooks found for app:', selectedAppId);
          
          // Check if user has any hooks at all for any app
          checkForAnyHooks();
        }
      }
      setLoadingHooks(false)
    }

    fetchHooks()
  }, [selectedAppId, supabase])

  // Check subscription status
  useEffect(() => {
    async function checkSubscription() {
      const { data: { user: subscriptionUser }, error: subscriptionError } = await supabase.auth.getUser()
      if (subscriptionError || !subscriptionUser) {
        console.error('Error fetching user:', subscriptionError)
        return
      }

      const subscriptionStatus = subscriptionUser.user_metadata?.stripe_subscription_status;
    }

    checkSubscription()
  }, [supabase])

  // Handle video creation
  const [showNoHooksDialog, setShowNoHooksDialog] = useState(false)
  const [showNoAppsDialog, setShowNoAppsDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Function to check if user has any hooks at all across any app
  const checkForAnyHooks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    const { data: allHooks, error } = await supabase
      .from('hooks')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
    
    if (error) {
      console.error('Error checking for hooks:', error)
      return false
    }
    
    const hasNoHooksAtAll = !allHooks || allHooks.length === 0
    
    // Only show the dialog if user has no hooks at all
    if (hasNoHooksAtAll) {
      setShowNoHooksDialog(true)
    }
    
    return !hasNoHooksAtAll // Return true if user has at least one hook
  }
  const handleCreateVideo = async () => {
    console.log('DEBUG: handleCreateVideo triggered', { selectedAppId, hook, selectedInfluencerVideo, selectedDemoVideo, contentRemaining, isPending, isCustomInfluencer });
    
    // Check if user has any apps
    const { data: appsData, error: appsError } = await supabase
      .from('apps')
      .select('id')
      .limit(1);
    
    console.log('DEBUG: appsData fetched', { appsData, appsError });
    if (appsError) {
      console.log('DEBUG: Error fetching apps', appsError);
      return;
    }
    
    if (!appsData || appsData.length === 0) {
      console.log('DEBUG: No apps available');
      setShowNoAppsDialog(true);
      return;
    }
    
    if (!selectedAppId) {
      console.log('DEBUG: No selectedAppId');
      toast({
        title: "App Required",
        description: "Please select an app for your video",
        variant: "destructive"
      });
      return;
    }

    // Check if hooks exist for the selected app
    const { data: hooksData, error: hooksError } = await supabase
      .from('hooks')
      .select('id')
      .eq('app_id', selectedAppId)
      .limit(1);
    console.log('DEBUG: hooksData fetched', { hooksData, hooksError });
    if (hooksError) {
      console.log('DEBUG: Error fetching hooks', hooksError);
      return;
    }
    if (!hooksData || hooksData.length === 0) {
      console.log('DEBUG: No hooks available for app', selectedAppId);
      
      // Check if user has any hooks at all for any app
      const hasAnyHooks = await checkForAnyHooks();
      if (!hasAnyHooks) {
        return; // Dialog already shown by checkForAnyHooks if needed
      }
      
      // If user has hooks for other apps but not this one, just show a toast
      toast({
        title: "No Hooks for This App",
        description: "Please select a different app or create hooks for this app first",
        variant: "destructive"
      });
      return;
    }

    if (!hook) {
      console.log('DEBUG: No hook provided');
      toast({
        title: "Hook Required",
        description: "Please select or generate a hook for your video",
        variant: "destructive"
      });
      return;
    }

    if (!selectedInfluencerVideo) {
      console.log('DEBUG: No influencer video selected');
      toast({
        title: "Influencer Required",
        description: "Please select an influencer from the grid",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDemoVideo) {
      console.log('DEBUG: No demo video selected');
      toast({
        title: "Demo Video Required",
        description: "Please upload or select a demo video",
        variant: "destructive"
      });
      return;
    }

    if (isPending) {
      console.log('DEBUG: Operation is pending');
      return;
    }

    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      console.log('DEBUG: Error fetching user', { userError });
      toast({
        title: "Authentication Error",
        description: "Please try logging in again",
        variant: "destructive"
      });
      return;
    }
    console.log('DEBUG: User fetched', currentUser);

    console.log('DEBUG: Checking contentRemaining value', contentRemaining);
    if (loading) {
      console.log('DEBUG: Subscription is still loading, aborting video creation');
      return;
    }
    if (subscription && contentRemaining <= 0) {
      console.log('DEBUG: Content limit reached. Triggering upgrade modal');
      setShowUpgradeModal(true);
      return;
    }

    // Validate required fields
    const missingFields = [];
    if (!selectedInfluencerVideo) missingFields.push('influencer video');
    if (!selectedDemoVideo) missingFields.push('demo video');
    if (!hook) missingFields.push('caption text');
    if (missingFields.length > 0) {
      console.log('DEBUG: Missing required fields', missingFields);
      return;
    }

    // Check and increment content usage
    const canCreate = await incrementContentUsage(currentUser.id);
    console.log('DEBUG: Result of incrementContentUsage', canCreate);
    if (!canCreate) {
      console.log('DEBUG: Monthly limit reached during incrementContentUsage. Triggering upgrade modal.');
      setShowUpgradeModal(true);
      return;
    }

    // Set creating state
    setIsCreating(true);
    
    // Create a placeholder for the in-progress video so loading UI appears immediately
    const tempOutputId = `temp-${Date.now()}`;
    const tempVideo: OutputVideo = {
      id: tempOutputId,
      status: 'in_progress',
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      url: ''
    };
    
    // Add the placeholder to the videos list
    setOutputVideos(prev => [tempVideo, ...prev]);
    console.log('DEBUG: Added temporary placeholder video with ID:', tempOutputId);

    startTransition(async () => {
      try {
        let influencerVideoUrl = selectedInfluencerVideo;
        let animatedSuccess = false;
        
        // If using custom influencer (static image), we need to generate a video
        if (isCustomInfluencer) {
          // Check if Fal API is configured before attempting animation
          const falApiKey = process.env.NEXT_PUBLIC_FAL_KEY;
          
          if (!falApiKey) {
            // No API key - show error and use static image instead
            console.error('🎬 [CUSTOM-INFLUENCER] Cannot animate - FAL API key is missing');
            toast({
              title: "Animation Not Available",
              description: "Custom influencer animation is disabled due to missing API configuration.",
              variant: "destructive"
            });
            console.log('🎬 [CUSTOM-INFLUENCER] Using static image instead:', selectedInfluencerVideo);
            // Keep the static image URL
            influencerVideoUrl = selectedInfluencerVideo;
          } else {
            // Show a toast to inform user of the process
            toast({
              title: "Animating Custom Influencer",
              description: "We're creating a video from your influencer image. This will take a moment.",
            });
            
            console.log('🎬 [CUSTOM-INFLUENCER] Starting custom influencer animation process');
            console.log('🎬 [CUSTOM-INFLUENCER] Is custom influencer:', isCustomInfluencer);
            console.log('🎬 [CUSTOM-INFLUENCER] Static image URL:', selectedInfluencerVideo);
            console.log('🎬 [CUSTOM-INFLUENCER] Hook text:', hook);
            
            try {
              // 1. Generate a video prompt based on the hook using server action
              console.log('🎬 [CUSTOM-INFLUENCER] Step 1: Generating video prompt from hook');
              const { prompt: videoPrompt } = await generateVideoPromptServer(hook);
              console.log('🎬 [CUSTOM-INFLUENCER] Prompt generation successful:', videoPrompt);
              
              // 2. Generate the video from the static image
              console.log('🎬 [CUSTOM-INFLUENCER] Step 2: Generating video from static image');
              console.log('🎬 [CUSTOM-INFLUENCER] Starting Fal API video generation - will wait for completion');
              
              try {
                // This will now use the proper queue.submit/status/result pattern
                influencerVideoUrl = await generateVideoFromImage(selectedInfluencerVideo, videoPrompt);
                console.log('🎬 [CUSTOM-INFLUENCER] Video generation completed successfully');
                console.log('🎬 [CUSTOM-INFLUENCER] Generated video URL:', influencerVideoUrl);
                animatedSuccess = true;
                
                // Validate the generated URL to ensure it exists and is accessible
                console.log('🎬 [CUSTOM-INFLUENCER] Validating generated video URL:', influencerVideoUrl);
                const urlCheck = await fetch(influencerVideoUrl, { method: 'HEAD' });
                if (!urlCheck.ok) {
                  throw new Error(`Generated video URL is not accessible: ${urlCheck.status}`);
                }
                
                // Let the user know the animation is complete
                toast({
                  title: "Animation Complete",
                  description: "Your custom influencer has been animated successfully!",
                });
              } catch (falError: any) {
                // Handle authentication/authorization errors specially
                if (falError.message && (
                  falError.message.includes('Unauthorized') || 
                  falError.message.includes('Authentication failed') ||
                  falError.message.includes('401')
                )) {
                  console.error('🎬 [CUSTOM-INFLUENCER] Authentication failed with Fal API:', falError);
                  toast({
                    title: "API Authentication Failed",
                    description: "Could not authenticate with the animation service. Please check your API key.",
                    variant: "destructive"
                  });
                  // Fall back to static image
                  console.log('🎬 [CUSTOM-INFLUENCER] Falling back to static image due to authentication error');
                } else {
                  // Generic error, show toast but continue with static image
                  console.error('🎬 [CUSTOM-INFLUENCER] Error in video generation:', falError);
                  toast({
                    title: "Animation Failed",
                    description: "We couldn't animate your custom influencer. Using static image instead.",
                    variant: "destructive"
                  });
                }
                // Continue with the original image URL if video generation fails
                influencerVideoUrl = selectedInfluencerVideo;
                console.log('🎬 [CUSTOM-INFLUENCER] Falling back to static image URL:', influencerVideoUrl);
              }
            } catch (error) {
              console.error('🎬 [CUSTOM-INFLUENCER] Error in custom influencer processing:', error);
              toast({
                title: "Animation Failed",
                description: "We couldn't animate your custom influencer. Using static image instead.",
                variant: "destructive"
              });
              
              // Continue with the original image URL if video generation fails
              influencerVideoUrl = selectedInfluencerVideo;
              console.log('🎬 [CUSTOM-INFLUENCER] Falling back to static image URL:', influencerVideoUrl);
            }
          }
        }
        
        // Only proceed with video creation if we have a valid influencer video URL
        // For static images that failed animation, show an error
        if (isCustomInfluencer && !animatedSuccess && influencerVideoUrl === selectedInfluencerVideo) {
          console.error('🔄 [VIDEO-CREATION] Cannot use static image for video creation - animation failed');
          toast({
            title: "Video Creation Failed",
            description: "We cannot use a static image for video creation. Please try again or select a video influencer.",
            variant: "destructive"
          });
          
          // Remove the temporary placeholder since we're not proceeding
          setOutputVideos(prev => prev.filter(v => v.id !== tempOutputId));
          setIsCreating(false);
          return;
        }
        
        // Proceed with video creation using either the original or newly generated video URL
        console.log('🔄 [VIDEO-CREATION] Starting final video creation with API');
        console.log('🔄 [VIDEO-CREATION] Final influencerVideoUrl for payload:', influencerVideoUrl);
        console.log('🔄 [VIDEO-CREATION] Demo footage URL:', selectedDemoVideo);
        console.log('🔄 [VIDEO-CREATION] Hook text:', hook);
        console.log('🔄 [VIDEO-CREATION] Text position:', textPosition);

        const payload = {
          influencerVideoUrl,
          demoFootageUrl: selectedDemoVideo,
          captionText: hook,
          captionPosition: textPosition,
          userUuid: currentUser.id,
          app_id: selectedAppId
        };
        console.log('🔄 [VIDEO-CREATION] Video creation request body:', JSON.stringify(payload));

        console.log('🔄 [VIDEO-CREATION] Calling createVideo API');
        const result = await createVideo(payload);
        console.log('🔄 [VIDEO-CREATION] createVideo API response:', JSON.stringify(result, null, 2));

        if ('error' in result) {
          console.log('DEBUG: Error creating video', result.error);
          toast({
            title: "Error creating video",
            description: result.error,
            variant: "destructive"
          });
          
          // Remove the temporary placeholder since creation failed
          setOutputVideos(prev => prev.filter(v => v.id !== tempOutputId));
        } else if (result.success && result.video) {
          console.log('DEBUG: Video created successfully with outputId:', result.video.outputId);
          setSelectedVideo(null);
          setSelectedDemoVideo('');
          setHook('');

          // Create new video object to replace the placeholder
          const newVideo: OutputVideo = {
            id: result.video.outputId,
            status: 'in_progress',
            created_at: new Date().toISOString(),
            user_id: currentUser.id,
            url: ''
          };
          console.log('DEBUG: Adding new video to list:', newVideo);
          
          // Replace the temporary placeholder with the real video
          setOutputVideos(prev => {
            console.log('DEBUG: Replacing temporary placeholder with real video');
            const filtered = prev.filter(v => v.id !== tempOutputId);
            return [newVideo, ...filtered];
          });

          // Start polling for video completion
          pollForVideoCompletion(result.video.outputId);

          toast({
            title: "Video creation started",
            description: "Your video is being processed and will appear in the list below when ready.",
          });
        } else {
          console.log('DEBUG: Unexpected response format:', result);
          toast({
            title: "Error creating video",
            description: "Unexpected response from server",
            variant: "destructive"
          });
          
          // Remove the temporary placeholder since creation failed
          setOutputVideos(prev => prev.filter(v => v.id !== tempOutputId));
        }
      } catch (error: any) {
        console.error('DEBUG: Exception in createVideo', error);
        toast({
          title: "Error creating video",
          description: error.message,
          variant: "destructive"
        });
        
        // Remove the temporary placeholder since an exception occurred
        setOutputVideos(prev => prev.filter(v => v.id !== tempOutputId));
      } finally {
        // Reset creating state after a short delay to allow for visual feedback
        setTimeout(() => {
          setIsCreating(false);
        }, 1000);
      }
    });
  };

  const handleUGCVideoSelect = (id: string, videoUrl: string, isCustom = false) => {
    console.log('handleUGCVideoSelect called with:', id, videoUrl, isCustom ? '(custom influencer)' : '(base influencer)')
    setSelectedVideo(id)
    setSelectedInfluencerVideo(videoUrl)
    setIsCustomInfluencer(isCustom)
  }

  const handleDemoVideoSelect = (url: string) => {
    setSelectedDemoVideo(url)
  }

  const handleDeleteVideo = async (id: string) => {
    try {
      // First get the video details to get the URL
      const { data: video, error: fetchError } = await supabase
        .from('output_content')
        .select('url, status')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching video:', fetchError)
        toast({
          title: "Error deleting video",
          description: "Could not fetch video details",
          variant: "destructive"
        })
        return
      }

      // Only try to delete from storage if the video has a URL and was completed
      if (video.url && video.status === 'completed') {
        // Extract the file path from the URL
        const filePath = video.url.includes('output-content/') 
          ? video.url.split('output-content/')[1]
          : video.url

        // Delete from storage
        const { error: storageError } = await supabase
          .storage
          .from('output-content')
          .remove([filePath])

        if (storageError) {
          console.error('Error deleting from storage:', storageError)
          // Don't return here, still try to delete the database record
        }
      }

      // Delete from database regardless of storage deletion result
      const { error: dbError } = await supabase
        .from('output_content')
        .delete()
        .eq('id', id)

      if (dbError) {
        console.error('Error deleting from database:', dbError)
        toast({
          title: "Error deleting video",
          description: "Could not delete video record",
          variant: "destructive"
        })
        return
      }

      // Update UI
      setOutputVideos(prev => prev.filter(video => video.id !== id))
      toast({
        title: "Video deleted",
        description: "Video has been removed successfully"
      })
    } catch (error) {
      console.error('Error in handleDeleteVideo:', error)
      toast({
        title: "Error deleting video",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  // Add state to track which demo is being deleted
  const [deletingDemoId, setDeletingDemoId] = useState<string | null>(null);

  const handleDeleteDemo = async (id: string) => {
    console.log('Deleting demo video with ID:', id);
    
    // Set the deleting state
    setDeletingDemoId(id);
    
    // Check if this is a temporary upload card
    const videoToDelete = demoVideos.find(v => v.id === id);
    if (videoToDelete?.isLoading) {
      console.log('Cancelling upload for video:', id);
      // If we're deleting a video that's still uploading, we should cancel the upload
      // For now, we'll just remove it from the UI
      setDemoVideos(videos => videos.filter(video => video.id !== id));
      setDeletingDemoId(null);
      return;
    }
    
    try {
      // First get the video details to get the content_url
      const { data: video, error: fetchError } = await supabase
        .from('input_content')
        .select('content_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching demo video details:', fetchError);
        toast({
          title: "Error deleting demo",
          description: "Could not fetch demo video details",
          variant: "destructive"
        });
        setDeletingDemoId(null);
        return;
      }

      // Delete from storage if we have a content_url
      if (video && video.content_url) {
        console.log('Deleting storage file:', video.content_url);
        
        // Delete from storage
        const { error: storageError } = await supabase
          .storage
          .from('input-content')
          .remove([video.content_url]);

        if (storageError) {
          console.error('Error deleting demo from storage:', storageError);
          // Don't return here, still try to delete the database record
        }
      }

      // Delete from database regardless of storage deletion result
      console.log('Deleting database record for demo:', id);
      const { error: dbError } = await supabase
        .from('input_content')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Error deleting demo from database:', dbError);
        toast({
          title: "Error deleting demo",
          description: "Could not delete demo record",
          variant: "destructive"
        });
        setDeletingDemoId(null);
        return;
      }

      // Update UI
      setDemoVideos(videos => videos.filter(video => video.id !== id));
      
      // If this was the selected demo, clear the selection
      if (selectedDemo === id) {
        setSelectedDemo('');
        setSelectedDemoVideo('');
      }
      
      toast({
        title: "Demo deleted",
        description: "Demo video has been removed successfully"
      });
    } catch (error) {
      console.error('Error in handleDeleteDemo:', error);
      toast({
        title: "Error deleting demo",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setDeletingDemoId(null);
    }
  };

  // Effect for setting default selections
  useEffect(() => {
    // Set default video selection (first video)
    if (!selectedInfluencerVideo && influencerVideos.length > 0) {
      setSelectedVideo(influencerVideos[0].id);
      setSelectedInfluencerVideo(influencerVideos[0].video_url);
    }

    // Set default demo video (first demo)
    if (!selectedDemoVideo && demoVideos.length > 0 && !loadingDemos) {
      setSelectedDemo(demoVideos[0].id ?? '');
      setSelectedDemoVideo(demoVideos[0].publicUrl ?? '');
    }
  }, [demoVideos, loadingDemos, selectedDemoVideo, selectedInfluencerVideo, influencerVideos])

  // Insert this function inside CreateAd (e.g., after other hooks/state declarations and before handleDeleteDemo)
  async function pollForVideoCompletion(outputId: string) {
    const pollInterval = 5000; // Poll every 5 seconds
    console.log(`🎥 [POLL] Starting to poll for video with ID: ${outputId}`);
    
    const intervalId = setInterval(async () => {
      console.log(`🎥 [POLL] Checking status of video with ID: ${outputId}`);
      
      const { data, error } = await supabase
        .from('output_content')
        .select('*')
        .eq('id', outputId)
        .single();
        
      if (error) {
        console.error(`🎥 [POLL] Error polling video completion for ID ${outputId}:`, error);
        return;
      }
      
      console.log(`🎥 [POLL] Current status for video ${outputId}:`, data?.status);
      
      if (data) {
        // Log additional details about the video
        console.log(`🎥 [POLL] Video details:`, {
          id: data.id,
          status: data.status,
          url: data.url,
          created_at: data.created_at
        });
        
        if (data.status === 'completed') {
          clearInterval(intervalId);
          console.log(`🎥 [POLL] Video processing completed for output_id ${outputId}`);
          console.log(`🎥 [POLL] Final video URL: ${data.url}`);
          
          if (typeof fetchOutputVideos === 'function') {
            console.log(`🎥 [POLL] Refreshing video list after completion`);
            fetchOutputVideos();
          }
        } else if (data.status === 'failed') {
          clearInterval(intervalId);
          console.error(`🎥 [POLL] Video processing FAILED for output_id ${outputId}`);
          console.error(`🎥 [POLL] Failure reason:`, data.error_message || 'No error message provided');
          
          // Still refresh the list to show the failed status
          if (typeof fetchOutputVideos === 'function') {
            fetchOutputVideos();
          }
          
          // Show a toast notification about the failure
          toast({
            title: "Video Creation Failed",
            description: "There was an issue processing your video. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        console.warn(`🎥 [POLL] No data returned for video ID ${outputId}`);
      }
    }, pollInterval);
    
    // Store the interval ID to clear it if the component unmounts
    return () => clearInterval(intervalId);
  }

  // Add uploadProgress state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // Add isUploading state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [uploadDebugInfo, setUploadDebugInfo] = useState<any>(null)

  const handleDemoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      console.log('File selected for upload:', file.name, 'size:', file.size, 'MB:', (file.size / (1024 * 1024)).toFixed(2));
      
      // Check file size (max 100MB)
      const fileSizeMB = file.size / (1024 * 1024);
      if (file.size > 100 * 1024 * 1024) {
        console.error(`File too large: ${fileSizeMB.toFixed(2)}MB exceeds 100MB limit`);
        
        // Set error information for the dialog
        setUploadError(`File size exceeds 100MB limit. Your file is ${fileSizeMB.toFixed(2)}MB.`);
        setUploadDebugInfo({
          fileName: file.name,
          fileSize: `${fileSizeMB.toFixed(2)}MB`,
          fileType: file.type,
          maxSize: '100MB'
        });
        setIsErrorDialogOpen(true);
        
        // Reset the file input
        e.target.value = '';
        return;
      }
      
      // Check file type
      if (!file.type.includes('mp4')) {
        console.error(`Invalid file type: ${file.type}. Only MP4 is supported.`);
        
        // Set error information for the dialog
        setUploadError(`Only MP4 video files are allowed. Your file is ${file.type || 'unknown type'}.`);
        setUploadDebugInfo({
          fileName: file.name,
          fileSize: `${fileSizeMB.toFixed(2)}MB`,
          fileType: file.type || 'unknown',
          supportedType: 'video/mp4'
        });
        setIsErrorDialogOpen(true);
        
        // Reset the file input
        e.target.value = '';
        return;
      }

      if (!selectedAppId) {
        console.error('No app selected for upload');
        setUploadError('Please select an app before uploading a demo video.');
        setUploadDebugInfo({
          fileName: file.name,
          fileSize: `${fileSizeMB.toFixed(2)}MB`,
          fileType: file.type
        });
        setIsErrorDialogOpen(true);
        return;
      }
      
      // Store the app ID at the time of upload to ensure consistency
      const appIdForUpload = selectedAppId;
      console.log('Uploading video for app ID:', appIdForUpload);
      
      console.log('File size check passed, proceeding with upload');
      
      // Create a temporary loading card with a unique ID
      const tempId = `temp-${Date.now()}`;
      const tempVideo: DemoVideo = {
        id: tempId,
        content_url: '',
        created_at: new Date().toISOString(),
        isLoading: true,
        uploadProgress: 0 // Start with 0% progress
      };
      
      console.log('Creating temporary upload card with ID:', tempId);
      
      // Add the temporary card to the demos list first
      setDemoVideos(prev => {
        console.log('Current demo videos:', prev.length);
        const updated = [tempVideo, ...prev];
        console.log('Updated demo videos:', updated.length);
        return updated;
      });
      
      // Then set the uploading state
      setIsUploading(true);
      setUploadProgress(0);
      setUploadingFile(file);
      
      // Define the file path for storage - ensure user ID is included
      // Use the session data directly from Supabase instead of the useUser hook
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user || !session.user.id) {
        console.error('User ID not available for upload from session');
        setUploadError('Authentication issue detected');
        setUploadDebugInfo({
          error: 'Session auth issue',
          details: 'Unable to access your account details for upload. Try refreshing the page.'
        });
        setIsErrorDialogOpen(true);
        return;
      }
      
      // Use the user ID from the session
      const userId = session.user.id;
      
      // Create a path with the user ID folder from session
      const timestamp = Date.now();
      const filePath = `${userId}/${timestamp}_${file.name}`;
      console.log('File will be uploaded to path:', filePath);

      // For larger files (>6MB), use TUS resumable uploads
      // For smaller files, continue using the API route to maintain consistency
      if (file.size > 6 * 1024 * 1024) {
        console.log('Using TUS resumable upload for large file:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
        handleDirectUpload(file, filePath, appIdForUpload, tempId);
      } else {
        console.log('Using API route for smaller file:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
        handleApiRouteUpload(file, appIdForUpload, tempId);
      }
    }
  };

  // New function to handle direct Supabase uploads using TUS protocol
  const handleDirectUpload = async (file: File, filePath: string, appIdForUpload: string, tempId: string) => {
    try {
      console.log('Setting up TUS resumable upload for:', filePath);
      
      // Dynamic import of tus-js-client to avoid server-side rendering issues
      const { Upload } = await import('tus-js-client');
      
      // Get the current user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }
      
      // Extract project ID from Supabase URL
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
      if (!projectId) {
        throw new Error('Could not determine Supabase project ID from URL');
      }
      
      // Log the path for debugging
      console.log('Setting up TUS upload with file path:', filePath);
      
      // Create and configure the TUS upload
      const upload = new Upload(file, {
        // Supabase's TUS endpoint
        endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          // Include authorization header with the access token
          authorization: `Bearer ${session.access_token}`,
          // Allow overwriting existing files with the same name
          'x-upsert': 'true',
        },
        // Upload data during creation to minimize requests
        uploadDataDuringCreation: true,
        // Remove fingerprint once upload completes to allow re-uploads of same file
        removeFingerprintOnSuccess: true,
        // Metadata required by Supabase TUS implementation
        metadata: {
          bucketName: 'input-content',
          objectName: filePath,  // The full path including user ID folder
          contentType: file.type,
          cacheControl: '3600',
        },
        // Chunk size must be exactly 6MB for Supabase TUS
        chunkSize: 6 * 1024 * 1024,
        // Handle errors during upload
        onError: function(error) {
          console.error('TUS upload failed:', error);
          handleUploadError(error, file, tempId);
        },
        // Track upload progress
        onProgress: function(bytesUploaded, bytesTotal) {
          const progress = Math.round((bytesUploaded / bytesTotal) * 100);
          console.log(`Upload progress: ${progress}% (${bytesUploaded}/${bytesTotal} bytes)`);
          updateUploadProgress(progress, tempId);
        },
        // Handle successful upload completion
        onSuccess: async function() {
          console.log('TUS upload completed successfully to path:', filePath);
          updateUploadProgress(100, tempId);
          await createDatabaseRecord(file, filePath, appIdForUpload, tempId);
        },
      });
      
      // Check if there are any previous uploads to continue
      console.log('Checking for previous uploads to resume...');
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length) {
        console.log('Found previous upload, resuming from last state');
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      
      // Start the upload
      console.log('Starting TUS upload...');
      upload.start();
      
    } catch (error) {
      console.error('Unexpected error during TUS upload setup:', error);
      handleUploadError(error, file, tempId);
    }
  };

  // Function to create database record after successful upload
  const createDatabaseRecord = async (file: File, filePath: string, appIdForUpload: string, tempId: string) => {
    try {
      console.log('Creating database record for uploaded file');
      
      // Get the user ID from the session to ensure consistency with upload path
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user || !session.user.id) {
        throw new Error('User ID not available for database insert');
      }
      
      // Use the user ID from the session for consistency
      const userId = session.user.id;
      console.log('Using user ID for database record:', userId);
      
      // Insert record into input_content table
      const { data: insertedRecord, error: insertError } = await supabase
        .from('input_content')
        .insert({
          user_id: userId, // Using the session user ID instead of the hook
          content_url: filePath,
          app_id: appIdForUpload
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Database insert failed:', insertError);
        handleUploadError(insertError, file, tempId);
        return;
      }
      
      // Get the public URL for the file
      const { data: publicUrlData } = supabase
        .storage
        .from('input-content')
        .getPublicUrl(filePath);
        
      console.log('Successfully created input_content record:', {
        ...insertedRecord,
        publicUrl: publicUrlData?.publicUrl
      });
      
      // Display success notification
      toast({
        title: "Demo Upload Success",
        description: "Your demo video has been uploaded successfully.",
      });
      
      // Clean up the UI and add the completed upload
      handleUploadSuccess(insertedRecord, publicUrlData?.publicUrl, appIdForUpload, tempId);
    } catch (error) {
      console.error('Error creating database record:', error);
      handleUploadError(error, file, tempId);
    } finally {
      setIsUploading(false);
      setUploadingFile(null);
    }
    
    // Return a promise that resolves when the function completes
    return Promise.resolve();
  };

  // Function to update the progress of an uploading file in the UI
  const updateUploadProgress = (progress: number, tempId: string) => {
    setDemoVideos(prev => prev.map(video => 
      video.id === tempId 
        ? { ...video, uploadProgress: progress } 
        : video
    ));
  };

  // Function to handle upload success
  const handleUploadSuccess = (
    record: any, 
    publicUrl: string | undefined, 
    appIdForUpload: string, 
    tempId: string
  ) => {
    // Remove the temporary card
    setDemoVideos(prev => prev.filter(video => video.id !== tempId));
    
    // Check if the app ID has changed during upload
    if (appIdForUpload !== selectedAppId) {
      console.warn('App ID changed during upload. Uploaded to:', appIdForUpload, 'Current:', selectedAppId);
      
      // Show a warning to the user
      setUploadError("Your video was uploaded to a different app than the one currently selected. Switching to the correct app.");
      setUploadDebugInfo({
        recordId: record?.id,
        appId: record?.app_id,
        uploadAppId: appIdForUpload,
        currentAppId: selectedAppId
      });
      setIsErrorDialogOpen(true);
      
      // Switch to the app ID used for the upload
      setSelectedAppId(appIdForUpload);
      return;
    }
    
    // Create a new video object with the response data
    const newVideo = {
      id: record?.id,
      content_url: record?.content_url,
      created_at: record?.created_at || new Date().toISOString(),
      app_id: record?.app_id,
      user_id: record?.user_id,
      publicUrl: publicUrl,
      isLoading: false,
      uploadProgress: undefined
    };
    
    // Add the new video directly to the state
    setDemoVideos(prev => [newVideo, ...prev]);
    
    // Select the newly uploaded video
    if (newVideo.publicUrl) {
      setSelectedDemoVideo(newVideo.publicUrl);
    }
    
    // Also refresh the videos list to ensure everything is in sync
    setTimeout(() => {
      console.log('Refreshing demo videos list after successful upload');
      fetchDemoVideos();
    }, 1000);
  };

  // Function to handle upload errors
  const handleUploadError = (error: any, file: File, tempId: string) => {
    console.error('Upload failed:', error);
    
    // Extract error message with fallbacks
    let errorMessage = 'Unknown error occurred during upload';
    let errorDetails = 'No additional details';
    let errorCategory = 'general';
    
    if (typeof error === 'object' && error !== null) {
      // Extract error message from various possible error objects
      if ('message' in error) {
        errorMessage = error.message;
      } else if ('error' in error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if ('statusText' in error) {
        errorMessage = error.statusText;
      }
      
      // Extract any additional details
      if ('details' in error) {
        errorDetails = error.details;
      } else if ('error' in error && typeof error.error === 'object' && error.error?.message) {
        errorDetails = error.error.message;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Categorize errors for better UI feedback
    if (
      errorMessage.includes('Authentication') ||
      errorMessage.includes('auth') ||
      errorMessage.includes('User ID not available') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('login') ||
      errorMessage.includes('access token') ||
      errorMessage.includes('unauthorized')
    ) {
      errorCategory = 'authentication';
      errorMessage = 'Authentication issue detected';
      errorDetails = 'Your login session may have expired.';
    } else if (
      errorMessage.includes('Storage upload failed') ||
      errorMessage.includes('bucket') ||
      errorMessage.includes('Storage system') ||
      errorMessage.includes('Bucket not found') ||
      errorMessage.includes('not found in bucket') ||
      errorMessage.includes('Object not found')
    ) {
      errorCategory = 'storage';
      errorMessage = 'Storage system error';
      errorDetails = 'We encountered an issue with our storage system.';
    } else if (
      errorMessage.includes('size') ||
      errorMessage.includes('File size exceeds') ||
      errorMessage.includes('too large') ||
      errorMessage.includes('exceed') ||
      (typeof file.size === 'number' && file.size > 100 * 1024 * 1024)
    ) {
      errorCategory = 'file-size';
      errorMessage = 'File size exceeds limit';
      errorDetails = 'Your video is too large (maximum 100MB).';
    } else if (
      errorMessage.includes('format') ||
      errorMessage.includes('MP4') ||
      errorMessage.includes('video files') ||
      errorMessage.includes('unsupported') ||
      (file.type !== 'video/mp4' && file.type !== '')
    ) {
      errorCategory = 'file-format';
      errorMessage = 'Unsupported file format';
      errorDetails = 'Only MP4 video files are supported.';
    } else if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('internet')
    ) {
      errorCategory = 'network';
      errorMessage = 'Network connection error';
      errorDetails = 'Check your internet connection and try again.';
    } else if (errorMessage.includes('createResumableUploadSession is not a function')) {
      errorCategory = 'configuration';
      errorMessage = 'Upload configuration issue';
      errorDetails = 'The system will use the TUS protocol for resumable uploads instead.';
    } else if (errorMessage.includes('storage quota')) {
      errorCategory = 'quota';
      errorMessage = 'Storage quota exceeded';
      errorDetails = 'You have reached your storage limit. Please delete some content and try again.';
    }
    
    // Format file size for better readability
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const fileSizeDisplay = parseFloat(fileSizeMB) > 0.1 ? `${fileSizeMB} MB` : `${(file.size / 1024).toFixed(2)} KB`;
    
    // Set error information for the dialog
    setUploadError(errorMessage);
    setUploadDebugInfo({
      appId: selectedAppId,
      fileName: file.name,
      fileSize: fileSizeDisplay,
      fileType: file.type || 'unknown',
      error: errorMessage,
      details: errorDetails,
      category: errorCategory,
      timestamp: new Date().toISOString()
    });
    
    setIsErrorDialogOpen(true);
    
    // Remove the temporary card
    setDemoVideos(prev => prev.filter(video => video.id !== tempId));
    setIsUploading(false);
    setUploadingFile(null);
    
    // Show a toast notification - use concise message for toast
    const toastMessage = errorCategory === 'file-size' ? 'File too large' :
                          errorCategory === 'file-format' ? 'Unsupported format' :
                          errorCategory === 'authentication' ? 'Authentication required' :
                          'Upload failed';
                          
    toast({
      title: "Upload Failed",
      description: toastMessage,
      variant: "destructive"
    });
  };

  // Function to handle API route uploads (for smaller files)
  const handleApiRouteUpload = async (file: File, appIdForUpload: string, tempId: string) => {
    const formData = new FormData();
    formData.append('videoFile', file);
    formData.append('appId', appIdForUpload);
    
    console.log('Starting XHR upload to /api/upload-demo');
    
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        updateUploadProgress(progress, tempId);
      }
    };
    
    xhr.onload = async () => {
      console.log('Upload completed with status:', xhr.status);
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        console.log('Server response:', result);
        if (result.error) {
          console.error('Demo upload error from server:', result.error);
          
          // Set error information for the dialog
          setUploadError(`Error uploading demo video: ${result.error}`);
          setUploadDebugInfo({
            appId: selectedAppId,
            fileName: file.name,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            status: xhr.status,
            details: result.details || 'No additional details'
          });
          setIsErrorDialogOpen(true);
          
          // Remove the temporary card
          setDemoVideos(prev => prev.filter(video => video.id !== tempId));
          setIsUploading(false);
          setUploadingFile(null);
        } else {
          // Display success notification
          toast({
            title: "Demo Upload Success",
            description: "Your demo video has been uploaded successfully.",
          });
          
          // Handle successful upload
          handleUploadSuccess(
            result.record,
            result.publicUrl,
            appIdForUpload,
            tempId
          );
          setIsUploading(false);
          setUploadingFile(null);
        }
      } else {
        console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          console.error('Parsed error response:', errorResponse);
          
          // If the error is about file size being too large, switch to direct upload
          if (xhr.status === 413 || (errorResponse.error && errorResponse.error.includes('size'))) {
            console.log('File too large for API route, switching to direct upload');
            setUploadError(`The file is too large for the API route. Switching to direct upload...`);
            setIsErrorDialogOpen(true);
            
            // Remove the temporary card and try with direct upload
            setDemoVideos(prev => prev.filter(video => video.id !== tempId));
            
            // Generate a new temp ID for the retry
            const newTempId = `temp-${Date.now()}`;
            const newTempVideo: DemoVideo = {
              id: newTempId,
              content_url: '',
              created_at: new Date().toISOString(),
              isLoading: true,
              uploadProgress: 0
            };
            
            // Add the new temporary card
            setDemoVideos(prev => [newTempVideo, ...prev]);
            
            // Retry with direct upload
            const filePath = `${user?.id}/${Date.now()}_${file.name}`;
            handleDirectUpload(file, filePath, appIdForUpload, newTempId);
            return;
          }
          
          // Handle other errors
          setUploadError(errorResponse.error || "Error uploading demo video. Please try again.");
          setUploadDebugInfo({
            appId: selectedAppId,
            fileName: file.name,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            status: xhr.status,
            error: errorResponse.error,
            details: errorResponse.details || 'No additional details'
          });
          
        } catch (e) {
          setUploadError("Error uploading demo video. Please try again.");
          setUploadDebugInfo({
            appId: selectedAppId,
            fileName: file.name,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            status: xhr.status,
            rawResponse: xhr.responseText
          });
        }
        setIsErrorDialogOpen(true);
        
        // Remove the temporary card
        setDemoVideos(prev => prev.filter(video => video.id !== tempId));
        setIsUploading(false);
        setUploadingFile(null);
      }
    };
    
    xhr.onerror = () => {
      console.error('XHR error occurred during upload');
      setUploadError("Network error occurred during upload. Please try again.");
      setUploadDebugInfo({
        appId: selectedAppId,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        error: 'Network error'
      });
      setIsErrorDialogOpen(true);
      
      // Remove the temporary card
      setDemoVideos(prev => prev.filter(video => video.id !== tempId));
      setIsUploading(false);
      setUploadingFile(null);
    };
    
    xhr.open('POST', '/api/upload-demo');
    xhr.send(formData);
  };

  // Function to fetch influencer videos from the database
  const fetchInfluencerVideos = async () => {
    setLoadingInfluencerVideos(true);
    try {
      const videos = await getInfluencerVidsWithTags();
      console.log('Fetched influencer videos:', videos.length || 0);
      setInfluencerVideos(videos);
      setFilteredInfluencerVideos(videos);
      
      // Set default selection if no video is selected
      if (!selectedVideo && videos.length > 0) {
        setSelectedVideo(videos[0].id);
        setSelectedInfluencerVideo(videos[0].video_url);
      }
    } catch (error) {
      console.error('Error fetching influencer videos:', error);
      toast({
        title: "Error Loading Videos",
        description: "Could not load influencer videos. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoadingInfluencerVideos(false);
    }
  };

  // Effect for fetching videos and demos
  useEffect(() => {
    // Fetch output videos, demo videos, and influencer videos when application loads
    fetchOutputVideos()
    fetchDemoVideos()
    fetchInfluencerVideos()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* No Hooks Dialog */}
        <AlertDialog open={showNoHooksDialog} onOpenChange={setShowNoHooksDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>No Hooks Available</AlertDialogTitle>
              <AlertDialogDescription>
                This app doesn't have any hooks generated yet. You need to generate hooks before creating videos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Link href="/dashboard/hooks">
                  Go to Hooks Page
                </Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* No Apps Dialog */}
        <AlertDialog open={showNoAppsDialog} onOpenChange={setShowNoAppsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>No Apps Available</AlertDialogTitle>
              <AlertDialogDescription>
                You don't have any apps yet. Please add an app before creating videos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Link href="/dashboard/apps">
                  Go to Apps Page
                </Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <div className="flex items-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Hook + Demo Format</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2" 
                  onClick={() => setIsViralFormatModalOpen(true)}
                >
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Learn more about this format</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <SubscriptionGuard>
          <div className="space-y-6 lg:space-y-8">
            {/* App Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-3 lg:mb-4">1. Select your app</h2>
              <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {loadingApps ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading apps...
                  </div>
                ) : apps.length > 0 ? (
                  apps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`flex-shrink-0 p-3 lg:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedAppId === app.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                      style={{ minWidth: '160px', maxWidth: '200px' }}
                    >
                      <div className="flex items-center gap-3">
                        {app.app_logo_url ? (
                          <div className="h-10 w-10 lg:h-12 lg:w-12 relative rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={app.app_logo_url}
                              alt={app.app_name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 lg:h-12 lg:w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-muted-foreground text-xl">?</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm lg:text-base text-foreground truncate">
                            {app.app_name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm lg:text-base">No apps found. <Link href="/dashboard/apps" className="text-primary hover:underline">Please add an app first.</Link></p>
                )}
              </div>
            </div>

            {/* Hook Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-3 lg:mb-4">2. Select a Hook</h2>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-3/4">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevHook}
                      disabled={hooks.length === 0}
                      className="hover:bg-primary/5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center" data-component-name="HookCounter">
                      <span className="text-sm text-muted-foreground">
                        {hooks.length > 0 ? 
                          `Hook ${currentHookIndex + 1} of ${hooks.length}` : 
                          <>
                            No hooks generated yet.{' '}
                            <Link href="/dashboard/hooks" className="text-primary hover:underline">
                              Generate some now
                            </Link>
                          </>
                        }
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextHook}
                      disabled={hooks.length === 0}
                      className="hover:bg-primary/5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={hook}
                      onChange={(e) => setHook(e.target.value)}
                      placeholder="Select an app to see available hooks..."
                      className="min-h-[100px] text-base"
                      data-component-name="HookTextarea"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Video Selection */}
            <div>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">3. Select an Influencer</h2>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Video Grid with Tabs */}
                <div className="w-full lg:w-3/4">
                  <div className="mb-4">
                    <FilterTags 
                      tags={uniqueTags} 
                      selectedTags={selectedTags} 
                      onChange={handleTagsChange} 
                    />
                  </div>
                  
                  {/* Replace VideoGrid with InfluencerTabs */}
                  <InfluencerTabs
                    baseInfluencerVideos={paginatedInfluencerVideos}
                    selectedVideo={selectedVideo}
                    onVideoSelect={handleUGCVideoSelect}
                    loading={loadingInfluencerVideos}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  
                  {/* Pagination Controls - Only show for Base Influencers tab */}
                  {!loadingInfluencerVideos && 
                   filteredInfluencerVideos.length > 0 && 
                   activeTab === 'base' && (
                    <div className="flex justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="hover:bg-primary/5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center">
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="hover:bg-primary/5"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Video Preview */}
                <div className="w-full lg:w-1/4">
                  {selectedVideo !== null && (
                    <div>
                      <div className="relative rounded-lg overflow-hidden border-4 border-white/10 bg-white/5 aspect-[9/16] max-w-[240px] mx-auto">
                        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                        {isCustomInfluencer ? (
                          <Image
                            src={selectedInfluencerVideo}
                            alt="Custom influencer"
                            fill
                            className="object-cover relative z-20"
                            onLoad={() => {
                              const loader = document.querySelector('.loader-element');
                              if (loader) loader.remove();
                            }}
                          />
                        ) : (
                        <video
                          key={selectedVideo}
                          src={selectedInfluencerVideo}
                          autoPlay
                          playsInline
                          loop
                          muted
                          controlsList="nodownload"
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full h-full object-cover relative z-20"
                          onLoadedData={(e) => {
                            const target = e.target as HTMLVideoElement;
                            target.previousElementSibling?.remove();
                          }}
                        />
                        )}
                        {hook && (
                          <div 
                            className={`absolute inset-x-0 z-30 p-3 lg:p-4 text-center ${
                              textPosition === 'top' ? 'top-0' : 
                              textPosition === 'middle' ? 'top-1/2 -translate-y-1/2' : 
                              'bottom-0'
                            }`}
                          >
                            <p className="text-white text-sm lg:text-base font-medium whitespace-pre-wrap [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]" style={{ fontFamily: 'TikTokDisplay' }}>
                              {hook}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-2 lg:gap-4 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTextPosition('top')}
                          className={textPosition === 'top' ? 'bg-primary text-white' : 'hover:bg-primary/5'}
                        >
                          Top
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTextPosition('middle')}
                          className={textPosition === 'middle' ? 'bg-primary text-white' : 'hover:bg-primary/5'}
                        >
                          Middle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTextPosition('bottom')}
                          className={textPosition === 'bottom' ? 'bg-primary text-white' : 'hover:bg-primary/5'}
                        >
                          Bottom
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Demos Section */}
            <div id="upload-demo">
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <h2 className="text-lg font-semibold">4. Demos</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Tips for filming great demo videos:</p>
                      <ul className="list-disc ml-4 mt-2 space-y-1">
                        <li>Film in portrait mode (9:16 ratio)</li>
                        <li>Keep it short (15-30 seconds)</li>
                        <li>Show clear app interactions</li>
                        <li>Ensure good lighting</li>
                        <li>Keep your hand movements smooth</li>
                        <li><strong>Maximum file size: 100MB</strong></li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground mb-3 lg:mb-4">Upload your product demo videos</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
                {loadingDemos ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading demos...
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-[9/16] rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleDemoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                        <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                        <p className="text-xs text-center text-muted-foreground">Upload Demo</p>
                        <p className="text-xs text-center font-semibold text-primary mt-1">Max 100MB</p>
                        <div className="mt-2 px-2 py-1 bg-primary/10 rounded-md">
                          <p className="text-[10px] text-center text-primary">MP4 format recommended</p>
                        </div>
                      </div>
                    </div>
                    
                    {demoVideos.map((video) => {
                      console.log('Rendering video:', video.id, 'isLoading:', video.isLoading, 'progress:', video.uploadProgress);
                      return (
                        <div
                          key={video.id}
                          className={`relative aspect-[9/16] rounded-lg overflow-hidden group transition-all duration-200 ${
                            video.isLoading 
                              ? 'bg-card border-2 border-primary/30 shadow-md' 
                              : selectedDemoVideo === video.publicUrl 
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg' 
                                : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md'
                          }`}
                        >
                          <button
                            onClick={() => handleDeleteDemo(video.id || '')}
                            className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 transition-opacity hover:bg-background ${
                              deletingDemoId === video.id 
                                ? 'opacity-100' 
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                            disabled={deletingDemoId === video.id}
                          >
                            {deletingDemoId === video.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                            ) : (
                              <X className="h-4 w-4 text-foreground" />
                            )}
                          </button>
                          <div 
                            className="aspect-[9/16] w-full rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => handleDemoVideoSelect(video.publicUrl || '')}
                          >
                            {video.isLoading ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-card border border-primary/20">
                                <Loader2 className="h-8 w-8 mb-3 animate-spin text-primary" />
                                <p className="text-sm font-medium mb-2">Uploading...</p>
                                {video.uploadProgress !== undefined && (
                                  <>
                                    <div className="w-4/5 h-3 bg-muted rounded-full overflow-hidden mb-2">
                                      <div 
                                        className="h-full bg-primary transition-all duration-300 ease-out"
                                        style={{ width: `${video.uploadProgress}%` }}
                                      ></div>
                                    </div>
                                    <p className="text-sm font-medium text-primary">{video.uploadProgress}%</p>
                                  </>
                                )}
                              </div>
                            ) : (
                              <video
                                key={video.publicUrl || ''}
                                src={video.publicUrl || ''}
                                className="w-full h-full object-cover"
                                preload="auto"
                                muted
                                loop
                                playsInline
                                controlsList="nodownload"
                                onContextMenu={(e) => e.preventDefault()}
                                onMouseEnter={(e) => e.currentTarget.play()}
                                onMouseLeave={(e) => {
                                  e.currentTarget.pause()
                                  e.currentTarget.currentTime = 0
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 lg:mt-8 flex justify-end">
            <ContentLimitGuard>
              <Button 
                type="button" 
                className="btn-gradient w-full sm:w-auto" 
                onClick={handleCreateVideo} 
                disabled={isCreating}
              >
                {isCreating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Create Video"
                )}
              </Button>
            </ContentLimitGuard>
          </div>
        </SubscriptionGuard>
        
        {/* My Videos Section */}
        <div className="mt-8 lg:mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-3 lg:mb-4">My Videos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
            {loadingOutputVideos ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : outputVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center col-span-full">No videos created yet. Create your first video above!</p>
            ) : (
              outputVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isPending={video.status === 'in_progress'}
                  onDelete={handleDeleteVideo}
                />
              ))
            )}
          </div>
        </div>

        <ViralFormatModal
          open={isViralFormatModalOpen}
          onOpenChange={setIsViralFormatModalOpen}
        />
        
        <UpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          subscription={subscription || { plan_name: 'starter' }}
          loading={loading}
        />

        {/* Error Dialog */}
        <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {uploadError?.includes("isn't appearing") 
                  ? "Video Uploaded Successfully" 
                  : uploadError?.includes("Storage upload failed") || uploadError?.includes("Storage system unavailable") || uploadError?.includes("Bucket not found")
                    ? "Upload Error"
                    : uploadError?.includes("File size exceeds")
                      ? "File Too Large"
                      : uploadError?.includes("MP4 video files")
                        ? "Unsupported File Format"
                        : "Upload Failed"}
              </DialogTitle>
              <DialogDescription>
                {uploadError?.includes("isn't appearing") 
                  ? "Your video was uploaded successfully but may take a moment to appear in the list."
                  : uploadError?.includes("Storage upload failed") || uploadError?.includes("Storage system unavailable") || uploadError?.includes("Bucket not found")
                    ? "There was a problem uploading your video."
                    : uploadError?.includes("File size exceeds")
                      ? "The video file you selected is too large."
                      : uploadError?.includes("MP4 video files")
                        ? "The file format you selected is not supported."
                        : "There was a problem uploading your demo video."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-lg text-sm">
                {uploadError?.includes("Authentication") || uploadError?.includes("User ID not available") ? (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Authentication Issue</h3>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>We're having trouble accessing your account details for this upload.</p>
                          <p className="font-medium mt-2">Try these solutions:</p>
                          <ul className="list-disc space-y-1 pl-5 mt-1">
                            <li>Refresh the page</li>
                            <li>Sign out and sign back in</li>
                            <li>Clear your browser cache</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : uploadError?.includes("isn't appearing") ? (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Video Not Appearing</h3>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>The video was uploaded but isn't appearing in your list.</p>
                          <p className="font-medium mt-2">Try these solutions:</p>
                          <ul className="list-disc space-y-1 pl-5 mt-1">
                            <li>Wait a few moments for the video to appear</li>
                            <li>Click the "Refresh Videos" button below</li>
                            <li>Check if you selected the correct app</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : uploadError?.includes("Storage upload failed") || uploadError?.includes("Storage system unavailable") || uploadError?.includes("Bucket not found") ? (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Storage System Error</h3>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>We encountered an issue with our storage system.</p>
                          <p className="font-medium mt-2">Try these solutions:</p>
                          <ul className="list-disc space-y-1 pl-5 mt-1">
                            <li>Refresh the page</li>
                            <li>Try uploading a smaller file</li>
                            <li>Check your internet connection</li>
                            <li>If the problem persists, please try again later</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : uploadError?.includes("File size exceeds") ? (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">File Size Limit Exceeded</h3>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>Your video is too large. Maximum size: 100MB</p>
                          <p>Current size: {uploadDebugInfo?.fileSize || 'unknown'}</p>
                          <p className="font-medium mt-2">Try these solutions:</p>
                          <ul className="list-disc space-y-1 pl-5 mt-1">
                            <li>Compress your video</li>
                            <li>Reduce the resolution or length</li>
                            <li>Try a different, smaller file</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : uploadError?.includes("MP4 video files") ? (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Unsupported File Format</h3>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>Only MP4 video files are supported.</p>
                          <p>Current format: {uploadDebugInfo?.fileType || 'unknown'}</p>
                          <p className="font-medium mt-2">Try these solutions:</p>
                          <ul className="list-disc space-y-1 pl-5 mt-1">
                            <li>Convert your video to MP4 format</li>
                            <li>
                              <a 
                                href="https://www.freeconvert.com/mp4-converter" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                Use an online converter
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Upload Failed</h3>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>There was a problem uploading your demo video.</p>
                          <p className="font-medium mt-2">Possible causes:</p>
                          <ul className="list-disc space-y-1 pl-5 mt-1">
                            <li>Corrupted video file</li>
                            <li>Internet connection issues</li>
                            <li>App selection changed during upload</li>
                            <li>Temporary server issue</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {uploadDebugInfo && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <details className="text-xs">
                      <summary className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                        Technical Details
                      </summary>
                      <pre className="mt-2 overflow-auto max-h-36 p-3 bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-200 text-xs">
                        {JSON.stringify(uploadDebugInfo, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setIsErrorDialogOpen(false)}
              >
                Close
              </Button>
              {uploadError?.includes("isn't appearing") ? (
                <Button
                  variant="default"
                  onClick={() => {
                    setIsErrorDialogOpen(false);
                    // Force a complete refresh of the videos list
                    setDemoVideos([]); // Clear the current list first
                    setLoadingDemos(true); // Show loading state
                    
                    // If we have app ID info in the debug info, try switching to that app
                    if (uploadDebugInfo?.uploadAppId && uploadDebugInfo.uploadAppId !== selectedAppId) {
                      setSelectedAppId(uploadDebugInfo.uploadAppId);
                    } else {
                      // Otherwise just refresh the videos with a slight delay
                      setTimeout(() => {
                        fetchDemoVideos().then(() => {
                          // After fetching, check if we have videos
                          if (demoVideos.length === 0) {
                            // If still no videos, try one more time with a longer delay
                            setTimeout(() => {
                              fetchDemoVideos();
                            }, 2000);
                          }
                        });
                      }, 500);
                    }
                  }}
                >
                  {uploadDebugInfo?.uploadAppId && uploadDebugInfo.uploadAppId !== selectedAppId 
                    ? "Switch to Correct App" 
                    : "Refresh Videos"}
                </Button>
              ) : uploadError?.includes("Storage upload failed") || uploadError?.includes("Storage system unavailable") || uploadError?.includes("Bucket not found") ? (
                <Button
                  variant="default"
                  onClick={() => {
                    setIsErrorDialogOpen(false);
                    // Refresh the page
                    window.location.reload();
                  }}
                >
                  Refresh Page
                </Button>
              ) : uploadError?.includes("File size exceeds") || uploadError?.includes("MP4 video files") ? (
                <Button
                  variant="default"
                  onClick={() => {
                    setIsErrorDialogOpen(false);
                  }}
                >
                  Try Another File
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => {
                    setIsErrorDialogOpen(false);
                    // Refresh the demo videos list
                    fetchDemoVideos();
                  }}
                >
                  Refresh Videos
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}