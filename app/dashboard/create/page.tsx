'use client'

import { useState, useEffect, useTransition, useMemo, memo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
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

interface Hook {
  id: string
  hook_text: string
}

const VideoGrid = memo(({ 
  videosToShow, 
  selectedVideo, 
  onVideoSelect 
}: { 
  videosToShow: number[], 
  selectedVideo: number | null,
  onVideoSelect: (num: number) => void
}) => (
  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
    {videosToShow.map((videoNumber) => (
      <div
        key={videoNumber}
        onClick={() => onVideoSelect(videoNumber)}
        className={`relative flex-shrink-0 cursor-pointer group transition-all duration-200 rounded-lg overflow-hidden ${
          selectedVideo === videoNumber
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
            : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md'
        }`}
        style={{ width: '100px', height: '177px' }}
      >
        <img
          src={`https://views-to-downloads.s3.us-east-2.amazonaws.com/thumbnail-${videoNumber}.png`}
          alt={`Video ${videoNumber}`}
          className="w-full h-full object-cover"
        />
      </div>
    ))}
  </div>
))
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
        }
      }
      setLoadingApps(false)
    }
    fetchApps()
  }, [supabase, selectedAppId])

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
  const [isUploadingDemo, startDemoUpload] = useTransition()

  // State for output videos
  const [outputVideos, setOutputVideos] = useState<OutputVideo[]>([])
  const [loadingOutputs, setLoadingOutputs] = useState(true)
  const [pendingVideo, setPendingVideo] = useState<any>(null)

  // Move randomization to a state that's set only once on mount
  const [allVideos, setAllVideos] = useState<number[]>([])

  // Initialize videos once on mount
  useEffect(() => {
    const videos = Array.from({ length: 59 }, (_, i) => i + 1)
      .sort(() => Math.random() - 0.5)
    setAllVideos(videos)
  }, []) // Empty dependency array means this runs once on mount

  // Pagination setup for the UGC videos
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 24
  const totalPages = Math.ceil(allVideos.length / pageSize)
  
  const handlePrev = () => {
    setCurrentPage((page) => (page > 1 ? page - 1 : page))
  }
  
  const handleNext = () => {
    setCurrentPage((page) => (page < totalPages ? page + 1 : page))
  }
  
  // Memoize the videos array so it doesn't change when hook changes
  const videosToShow = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return allVideos?.slice(startIndex, endIndex) || []
  }, [currentPage, pageSize, allVideos])
  
  // Fetch demo videos
  useEffect(() => {
    async function fetchDemoVideos() {
      setLoadingDemos(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('input_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching demo videos:', error)
      } else if (data) {
        const demoVideosWithUrls = await Promise.all(data.map(async (video) => {
          // Get the public URL for the full path including user ID
          const { data: publicData } = supabase
            .storage
            .from('input-content')
            .getPublicUrl(video.content_url)
          return { ...video, publicUrl: publicData.publicUrl }
        }))
        setDemoVideos(demoVideosWithUrls)
      }
      setLoadingDemos(false)
    }
    fetchDemoVideos()
  }, [supabase])

  // Function to fetch output videos
  const fetchOutputVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: videos, error } = await supabase
      .from('output_content')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching output videos:', error);
      return;
    }
    const outputVideosWithUrls = (videos || []).map((video) => {
      const videoPath = video.url.includes('output-content/')
        ? video.url.split('output-content/')[1]
        : video.url;
      const { data: { publicUrl } } = supabase
        .storage
        .from('output-content')
        .getPublicUrl(videoPath);
      return { ...video, url: publicUrl };
    });
    setOutputVideos(outputVideosWithUrls);
    setLoadingOutputs(false);
  };

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const subscriptionStatus = user.user_metadata?.stripe_subscription_status;
      // setIsSubscribed(subscriptionStatus === 'active');
    }

    checkSubscription()
  }, [supabase])

  // Get UGC video URL
  const getUGCVideoUrl = (videoNumber: number | null) => {
    if (!videoNumber) return ''
    return `https://views-to-downloads.s3.us-east-2.amazonaws.com/${videoNumber}.mp4`
  }

  // Handle video creation
  const [showNoHooksDialog, setShowNoHooksDialog] = useState(false)
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('DEBUG: Error fetching user', { userError, user });
      return;
    }
    console.log('DEBUG: User fetched', user);

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
    const canCreate = await incrementContentUsage(user.id);
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
      userUuid: user.id,
      app_id: selectedAppId
    };
    console.log('Video creation request body:', JSON.stringify(payload));

    // Create a pending video object
    console.log('DEBUG: Creating pending video object');
    const pendingVideoObj = {
      id: crypto.randomUUID(),
      status: 'pending',
      created_at: new Date().toISOString(),
      app_id: selectedAppId,
      user_id: user.id,
      url: ''
    };

    // Add the pending video to the list
    setOutputVideos(prev => [pendingVideoObj, ...prev]);
    setPendingVideo(pendingVideoObj);
    console.log('DEBUG: Pending video object added', pendingVideoObj);

    toast({
      title: "Creating video...",
      description: "This should take a few minutes",
    });

    startTransition(async () => {
      try {
        console.log('DEBUG: Calling createVideo with', payload);
        const result = await createVideo(payload);
        console.log('DEBUG: createVideo result', result);

        if ('error' in result) {
          console.log('DEBUG: Error creating video', result.error);
          setOutputVideos(prev => prev.filter(v => v.id !== pendingVideoObj.id));
          setPendingVideo(null);
          return;
        } else {
          console.log('DEBUG: Video created successfully, resetting state');
          setSelectedVideo(null);
          setSelectedDemoVideo('');
          setHook('');
          setPendingVideo(null);
          console.log('DEBUG: Attempting to fetch updated videos');
          if (typeof fetchOutputVideos === 'function') {
            fetchOutputVideos();
          } else {
            console.log('DEBUG: fetchOutputVideos is not defined');
          }

          if (result.output_id) {
            pollForVideoCompletion(result.output_id);
          }
        }
      } catch (error: any) {
        console.error('DEBUG: Exception in createVideo', error);
        toast({
          title: "Error creating video",
          description: error.message,
          variant: "destructive"
        });

        setOutputVideos(prev => prev.filter(video => video.id !== pendingVideoObj.id));
        setPendingVideo(null);
      }
    });
  };

  const handleUGCVideoSelect = (num: number) => {
    setSelectedVideo(num)
    setSelectedInfluencerVideo(getUGCVideoUrl(num))
  }

  const handleDemoVideoSelect = (url: string) => {
    setSelectedDemoVideo(url)
  }

  const handleDeleteVideo = async (id: string) => {
    try {
      // First get the video details to get the URL
      const { data: video, error: fetchError } = await supabase
        .from('output_content')
        .select('url')
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
        toast({
          title: "Error deleting video",
          description: "Could not delete video file",
          variant: "destructive"
        })
        return
      }

      // Delete from database
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

  const handleDeleteDemo = (id: string) => {
    setDemoVideos(videos => videos.filter(video => video.id !== id))
  }

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

  console.log('CreateAd subscription:', subscription);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
          <div className="space-y-8">
            {/* App Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4">1. Select your app</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-muted">
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
                      className={`flex-shrink-0 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedAppId === app.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                      style={{ minWidth: '200px' }}
                    >
                      <div className="flex items-center gap-3">
                        {app.app_logo_url ? (
                          <div className="h-12 w-12 relative rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={app.app_logo_url}
                              alt={app.app_name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-muted-foreground text-xl">?</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {app.app_name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No apps found. Please add an app first.</p>
                )}
              </div>
            </div>

            {/* Hook Selection */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">2. Choose a Hook</h2>
              {loadingHooks ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="animate-spin h-6 w-6 text-primary" />
                </div>
              ) : hooks.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevHook}
                      className="hover:bg-primary/5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                      <Input
                        value={hook}
                        onChange={(e) => setHook(e.target.value)}
                        className="input-dark w-full"
                        placeholder="Enter hook text..."
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextHook}
                      className="hover:bg-primary/5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">
                  No hooks found for this app. <Link href="/dashboard/hooks" className="text-primary hover:underline">Generate some now!</Link>
                </p>
              )}
            </div>

            {/* Video Selection */}
            <div>
              <div className="flex justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">3. Select a Video</h2>
                <span className="text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex gap-6">
                {/* Video Grid */}
                <div className="w-3/4">
                  <VideoGrid 
                    videosToShow={videosToShow}
                    selectedVideo={selectedVideo}
                    onVideoSelect={handleUGCVideoSelect}
                  />
                  <div className="flex justify-center mt-4 gap-2 w-3/4">
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
                <div className="w-1/4">
                  {selectedVideo !== null && (
                    <div>
                      <div className="relative rounded-lg overflow-hidden border-4 border-white/10 bg-white/5">
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
                          className="w-full h-full object-cover relative z-20"
                          onLoadedData={(e) => {
                            const target = e.target as HTMLVideoElement;
                            target.previousElementSibling?.remove();
                          }}
                        />
                        {hook && (
                          <div 
                            className={`absolute inset-x-0 z-30 p-4 text-center ${
                              textPosition === 'top' ? 'top-0' : 
                              textPosition === 'middle' ? 'top-1/2 -translate-y-1/2' : 
                              'bottom-0'
                            }`}
                          >
                            <p className="text-white text-base md:text-lg font-medium whitespace-pre-wrap [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]" style={{ fontFamily: 'TikTokDisplay' }}>
                              {hook}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-4 mt-4">
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
              <h2 className="text-lg font-semibold mb-4">4. Demos</h2>
              <p className="text-sm text-muted-foreground mb-4">Upload your product demo videos</p>
              <div className="flex items-start gap-4">
                <label
                  htmlFor="demoVideo"
                  className="flex-shrink-0 w-24 h-[170px] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center bg-card text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200"
                >
                  {isUploadingDemo ? (
                    <Loader2 className="animate-spin h-6 w-6" />
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl">+</span>
                      <p className="text-xs mt-2">Upload demo</p>
                    </div>
                  )}
                </label>

                {/* Display uploaded demo videos */}
                <div className="flex-1 flex flex-wrap gap-2 items-start">
                  {loadingDemos ? (
                    <Loader2 className="animate-spin h-6 w-6 text-primary" />
                  ) : demoVideos.length > 0 ? (
                    demoVideos.map((video) => (
                      <div
                        key={video.id}
                        className={`relative flex-shrink-0 cursor-pointer group transition-all duration-200 rounded-lg overflow-hidden ${
                          selectedDemoVideo === video.publicUrl 
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg' 
                            : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md'
                        }`}
                        style={{ width: '100px' }}
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDemo(video.id);
                          }}
                          className="absolute top-1 right-1 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div 
                          className="aspect-[9/16] w-full rounded-lg overflow-hidden"
                          onClick={() => handleDemoVideoSelect(video.publicUrl || '')}
                        >
                          <video
                            key={video.publicUrl || ''}
                            src={video.publicUrl || ''}
                            className="w-full h-full object-cover"
                            preload="auto"
                            muted
                            loop
                            playsInline
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause()
                              e.currentTarget.currentTime = 0
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No demos uploaded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <ContentLimitGuard>
              <Button 
                type="button" 
                className="btn-gradient" 
                onClick={handleCreateVideo} 
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
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
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">My Videos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loadingOutputs ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : outputVideos.length === 0 ? (
              <p className="text-muted-foreground text-center">No videos created yet. Create your first video above!</p>
            ) : (
              outputVideos.map((video) => {
                if (video.status === 'pending') {
                  return (
                    <div key={video.id} className="border border-dashed p-4 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Processing video...</span>
                    </div>
                  );
                } else {
                  return (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      onDelete={handleDeleteVideo}
                      isPending={false}
                    />
                  );
                }
              })
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
      </div>
    </div>
  )
}