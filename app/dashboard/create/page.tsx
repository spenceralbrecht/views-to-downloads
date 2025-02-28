'use client'

import { useState, useEffect, useTransition, useMemo, memo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, X, HelpCircle, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { uploadDemoVideo, createVideo } from '../actions'
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
import type { OutputContent } from '@/types/video'
import { Textarea } from "@/components/ui/textarea"

interface Hook {
  id: string
  hook_text: string
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

const VideoGrid = memo(({ 
  videosToShow, 
  selectedVideo, 
  onVideoSelect 
}: { 
  videosToShow: number[], 
  selectedVideo: number | null,
  onVideoSelect: (num: number) => void
}) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
      {videosToShow.map((videoNumber) => (
        <div
          key={videoNumber}
          onClick={() => {
            console.log('Selected video number:', videoNumber)
            onVideoSelect(videoNumber)
          }}
          className={`relative flex-shrink-0 cursor-pointer group transition-all duration-200 rounded-lg overflow-hidden ${
            selectedVideo === videoNumber
              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
              : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md'
          }`}
          style={{ width: '100px', height: '177px' }}
        >
          <img
            src={getUGCThumbnailUrl(videoNumber)}
            alt={`Video ${videoNumber}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  )
})
VideoGrid.displayName = 'VideoGrid'

export default function CreateAd() {
  const supabase = createClientComponentClient()
  const [isPending, startTransition] = useTransition()
  const user = useUser()
  const { isSubscribed, contentRemaining, subscription, loading } = useSubscription(user)
  const { toast } = useToast()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

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

  // Update hook text when index changes
  useEffect(() => {
    if (hooks.length > 0 && currentHookIndex >= 0 && currentHookIndex < hooks.length) {
      setHook(hooks[currentHookIndex].hook_text)
    }
  }, [currentHookIndex, hooks])

  const handlePrevHook = () => {
    setCurrentHookIndex((i) => (i > 0 ? i - 1 : hooks.length - 1))
  }

  const handleNextHook = () => {
    setCurrentHookIndex((i) => (i < hooks.length - 1 ? i + 1 : 0))
  }

  // State for video selection
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null)
  const [selectedInfluencerVideo, setSelectedInfluencerVideo] = useState('')
  const [selectedDemoVideo, setSelectedDemoVideo] = useState('')
  const [selectedDemo, setSelectedDemo] = useState<string>('')

  // State for demo videos
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([])
  const [loadingDemos, setLoadingDemos] = useState(false)

  // State for output videos
  const [outputVideos, setOutputVideos] = useState<OutputVideo[]>([])
  const [loadingOutputs, setLoadingOutputs] = useState(true)
  const [pendingVideo, setPendingVideo] = useState<any>(null)

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

  // Pagination setup for the UGC videos
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 24
  const totalPages = Math.ceil(allVideos.length / pageSize)
  
  // Add logging for pagination
  useEffect(() => {
    console.log('Current allVideos state:', allVideos);
    console.log('Total pages:', totalPages);
    console.log('Current page:', currentPage);
  }, [allVideos, totalPages, currentPage])
  
  const handlePrev = () => {
    console.log('Navigating to previous page');
    setCurrentPage((page) => (page > 1 ? page - 1 : page))
  }
  
  const handleNext = () => {
    console.log('Navigating to next page');
    setCurrentPage((page) => (page < totalPages ? page + 1 : page))
  }
  
  // Memoize the videos array so it doesn't change when hook changes
  const videosToShow = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const videos = allVideos?.slice(startIndex, endIndex) || []
    console.log('Videos to show for current page:', {
      page: currentPage,
      startIndex,
      endIndex,
      pageSize,
      numberOfVideos: videos.length,
      actualVideos: videos.join(', ')
    });
    return videos;
  }, [currentPage, pageSize, allVideos])
  
  // Function to fetch demo videos
  const fetchDemoVideos = async () => {
    setLoadingDemos(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user found')
        setLoadingDemos(false)
        return
      }

      const query = supabase
        .from('input_content')
        .select('*')
        .eq('user_id', user.id)

      // If an app is selected, filter by app_id
      if (selectedAppId) {
        query.eq('app_id', selectedAppId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching demo videos:', error)
        toast({
          title: "Error Loading Demos",
          description: "Could not load your demo videos. Please try refreshing the page.",
          variant: "destructive"
        })
      } else if (data) {
        console.log('Fetched demo videos:', data)
        const demoVideosWithUrls = await Promise.all(data.map(async (video) => {
          // Get the public URL for the full path including user ID
          const { data: publicData } = supabase
            .storage
            .from('input-content')
            .getPublicUrl(video.content_url)
          return { 
            ...video, 
            publicUrl: publicData.publicUrl,
            isLoading: false, // Add loading state for each video
            uploadProgress: undefined // Initialize uploadProgress
          }
        }))
        setDemoVideos(demoVideosWithUrls)
        
        // If we have a newly uploaded video, select it automatically
        if (demoVideosWithUrls.length > 0 && isUploading === false && uploadingFile !== null) {
          const latestVideo = demoVideosWithUrls[0]
          if (latestVideo.publicUrl) {
            setSelectedDemoVideo(latestVideo.publicUrl)
          }
          setUploadingFile(null) // Clear the uploading file reference
        }
      }
    } catch (error: any) {
      console.error('Error in fetchDemoVideos:', error)
      toast({
        title: "Error Loading Demos",
        description: "Could not load your demo videos. Please try refreshing the page.",
        variant: "destructive"
      })
    } finally {
      setLoadingDemos(false)
    }
  }

  // Call fetchDemoVideos on mount
  useEffect(() => {
    // Only fetch demo videos if an app is selected
    if (selectedAppId) {
      fetchDemoVideos()
    }
  }, []) // Empty dependency array means this runs once on mount

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
    setLoadingOutputs(false);
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
  const [isCreating, setIsCreating] = useState(false)
  const handleCreateVideo = async () => {
    console.log('DEBUG: handleCreateVideo triggered', { selectedAppId, hook, selectedInfluencerVideo, selectedDemoVideo, contentRemaining, isPending });
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
      setShowNoHooksDialog(true);
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
        title: "UGC Video Required",
        description: "Please select an influencer video from the grid",
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

    // Use the selected influencer video URL directly
    const influencerVideoUrl = selectedInfluencerVideo;
    console.log('Final influencerVideoUrl for payload:', influencerVideoUrl);

    const payload = {
      influencerVideoUrl,
      demoFootageUrl: selectedDemoVideo,
      captionText: hook,
      captionPosition: textPosition,
      userUuid: currentUser.id,
      app_id: selectedAppId
    };
    console.log('Video creation request body:', JSON.stringify(payload));

    // Set creating state
    setIsCreating(true)

    startTransition(async () => {
      try {
        console.log('DEBUG: Calling createVideo with', payload);
        const result = await createVideo(payload);
        console.log('DEBUG: createVideo result', result);

        if ('error' in result) {
          console.log('DEBUG: Error creating video', result.error);
          toast({
            title: "Error creating video",
            description: result.error,
            variant: "destructive"
          });
        } else if (result.success && result.video) {
          console.log('DEBUG: Video created successfully with outputId:', result.video.outputId);
          setSelectedVideo(null);
          setSelectedDemoVideo('');
          setHook('');

          // Create new video object and add to list
          const newVideo: OutputVideo = {
            id: result.video.outputId,
            status: 'in_progress',
            created_at: new Date().toISOString(),
            user_id: currentUser.id,
            url: ''
          };
          console.log('DEBUG: Adding new video to list:', newVideo);
          setOutputVideos(prev => {
            console.log('DEBUG: Previous videos:', prev);
            const updated = [newVideo, ...prev];
            console.log('DEBUG: Updated videos list:', updated);
            return updated;
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
        }
      } catch (error: any) {
        console.error('DEBUG: Exception in createVideo', error);
        toast({
          title: "Error creating video",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        // Reset creating state after a short delay to allow for visual feedback
        setTimeout(() => {
          setIsCreating(false);
        }, 1000);
      }
    });
  };

  const handleUGCVideoSelect = (num: number) => {
    console.log('handleUGCVideoSelect called with:', num)
    setSelectedVideo(num)
    const videoUrl = getUGCVideoUrl(num)
    console.log('Setting selectedInfluencerVideo to:', videoUrl)
    setSelectedInfluencerVideo(videoUrl)
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
    if (!selectedInfluencerVideo && videosToShow.length > 0) {
      setSelectedVideo(videosToShow[0]);
      setSelectedInfluencerVideo(getUGCVideoUrl(videosToShow[0]));
    }

    // Set default demo video (first demo)
    if (!selectedDemoVideo && demoVideos.length > 0 && !loadingDemos) {
      setSelectedDemo(demoVideos[0].id ?? '');
      setSelectedDemoVideo(demoVideos[0].publicUrl ?? '');
    }
  }, [demoVideos, loadingDemos, selectedDemoVideo, selectedInfluencerVideo, videosToShow])


  // Insert this function inside CreateAd (e.g., after other hooks/state declarations and before handleDeleteDemo)
  async function pollForVideoCompletion(outputId: string) {
    const pollInterval = 5000; // Poll every 5 seconds
    const intervalId = setInterval(async () => {
      const { data, error } = await supabase
        .from('output_content')
        .select('*')
        .eq('id', outputId)
        .single();
      if (error) {
        console.error('Error polling video completion:', error);
        return;
      }
      if (data && data.status === 'completed') {
        clearInterval(intervalId);
        console.log('Video processing completed for output_id', outputId);
        if (typeof fetchOutputVideos === 'function') {
          fetchOutputVideos();
        }
      }
    }, pollInterval);
  }

  // Add uploadProgress state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // Add isUploading state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)

  const handleDemoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      console.log('File selected for upload:', file.name, 'size:', file.size, 'MB:', (file.size / (1024 * 1024)).toFixed(2));
      
      // Check file size (max 100MB)
      const fileSizeMB = file.size / (1024 * 1024);
      if (file.size > 100 * 1024 * 1024) {
        console.error(`File too large: ${fileSizeMB.toFixed(2)}MB exceeds 100MB limit`);
        toast({
          title: "⚠️ File Too Large",
          description: `Your file is ${fileSizeMB.toFixed(2)}MB. Demo videos must be under 100MB. Please compress your video and try again.`,
          variant: "destructive",
          duration: 6000, // Show for longer
        });
        
        // Show a second toast with compression suggestion
        setTimeout(() => {
          toast({
            title: "💡 Compression Tip",
            description: "Try using a free online video compressor like HandBrake or an online service to reduce file size.",
            duration: 8000,
          });
        }, 1000);
        
        // Reset the file input
        e.target.value = '';
        return;
      }

      if (!selectedAppId) {
        console.error('No app selected for upload');
        toast({
          title: "App Required",
          description: "Please select an app before uploading a demo video.",
          variant: "destructive"
        });
        return;
      }
      
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
      
      const formData = new FormData();
      formData.append('videoFile', file);
      formData.append('appId', selectedAppId);
      
      console.log('Starting XHR upload to /api/upload-demo');
      
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log('Upload progress:', progress + '%', 'loaded:', event.loaded, 'total:', event.total);
          setUploadProgress(progress);
          
          // Update the temporary card with the current progress
          setDemoVideos(prev => prev.map(video => 
            video.id === tempId 
              ? { ...video, uploadProgress: progress } 
              : video
          ));
        }
      };
      
      xhr.onload = async () => {
        console.log('Upload completed with status:', xhr.status);
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          console.log('Server response:', result);
          if (result.error) {
            console.error('Demo upload error from server:', result.error);
            toast({
              title: "Demo Upload Failed",
              description: `Error uploading demo video. Please report this error: ${result.error}`,
              variant: "destructive"
            });
            
            // Remove the temporary card
            setDemoVideos(prev => prev.filter(video => video.id !== tempId));
          } else {
            console.log('Upload successful, created record:', result.record);
            toast({
              title: "Demo Upload Success",
              description: "Your demo video has been uploaded successfully.",
            });
            
            // Remove the temporary card and fetch the real one
            setDemoVideos(prev => prev.filter(video => video.id !== tempId));
            
            // Wait a short moment for the server to process the video
            console.log('Waiting before fetching updated demo videos...');
            setTimeout(() => {
              console.log('Fetching updated demo videos');
              fetchDemoVideos();
            }, 1000);
          }
        } else {
          console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('Parsed error response:', errorResponse);
            toast({
              title: "Demo Upload Failed",
              description: errorResponse.error || "Error uploading demo video. Please try again.",
              variant: "destructive"
            });
          } catch (e) {
            console.error('Could not parse error response:', e);
            toast({
              title: "Demo Upload Failed",
              description: "Error uploading demo video. Please try again.",
              variant: "destructive"
            });
          }
          
          // Remove the temporary card
          setDemoVideos(prev => prev.filter(video => video.id !== tempId));
        }
        setUploadProgress(null);
        setIsUploading(false);
        setUploadingFile(null);
      };
      
      xhr.onerror = (error) => {
        console.error('Upload failed with error:', error);
        toast({
          title: "Demo Upload Failed",
          description: "Error uploading demo video. Please check your connection and try again.",
          variant: "destructive"
        });
        setUploadProgress(null);
        setIsUploading(false);
        setUploadingFile(null);
        
        // Remove the temporary card
        setDemoVideos(prev => prev.filter(video => video.id !== tempId));
      };
      
      xhr.open('POST', '/api/upload-demo');
      xhr.send(formData);
      console.log('XHR request sent');
    }
  };

  // Refresh demo videos when selected app changes
  useEffect(() => {
    if (selectedAppId) {
      fetchDemoVideos()
    }
  }, [selectedAppId])

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
                    <div className="flex-1 text-center">
                      <span className="text-sm text-muted-foreground">
                        {hooks.length > 0 ? `Hook ${currentHookIndex + 1} of ${hooks.length}` : 'No hooks available'}
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
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Video Selection */}
            <div>
              <div className="flex justify-between items-center mb-3 lg:mb-4">
                <h2 className="text-lg font-semibold text-foreground">3. Select a Video</h2>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Video Grid */}
                <div className="w-full lg:w-3/4">
                  <VideoGrid 
                    videosToShow={videosToShow}
                    selectedVideo={selectedVideo}
                    onVideoSelect={handleUGCVideoSelect}
                  />
                  <div className="flex justify-center mt-4 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handlePrev} 
                      disabled={currentPage === 1}
                      className="hover:bg-primary/5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleNext} 
                      disabled={currentPage === totalPages}
                      className="hover:bg-primary/5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Video Preview */}
                <div className="w-full lg:w-1/4">
                  {selectedVideo !== null && (
                    <div>
                      <div className="relative rounded-lg overflow-hidden border-4 border-white/10 bg-white/5 aspect-[9/16] max-w-[240px] mx-auto">
                        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                        <video
                          key={selectedVideo}
                          src={getUGCVideoUrl(selectedVideo)}
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
            <div>
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
            {loadingOutputs ? (
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

        {/* Upgrade Modal */}
        <UpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          subscription={subscription || { plan_name: 'starter' }}
          loading={loading}
        />

        {/* Version Display */}
        <div className="fixed bottom-2 left-2">
          <span className="text-xs text-gray-400">
            {process.env.VERCEL_GIT_COMMIT_SHA 
              ? `v${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
              : 'dev'}
          </span>
        </div>
      </div>
    </div>
  )
}