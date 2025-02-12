'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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

interface Hook {
  id: string
  hook_text: string
}

export default function CreateAd() {
  const supabase = createClientComponentClient()
  const [isPending, startTransition] = useTransition()
  const user = useUser()
  const { isSubscribed, contentRemaining } = useSubscription(user)
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

  // Generate an array of 69 videos and shuffle them
  const allVideos = Array.from({ length: 69 }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5)

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
  
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const videosToShow = allVideos.slice(startIndex, endIndex)
  
  // Fetch demo videos
  useEffect(() => {
    async function fetchDemoVideos() {
      setLoadingDemos(true)
      const { data, error } = await supabase
        .from('input_content')
        .select('*')
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

  // Fetch output videos
  useEffect(() => {
    const fetchOutputVideos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: videos, error } = await supabase
        .from('output_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching output videos:', error)
        return
      }

      // Get public URLs for the output videos
      const outputVideosWithUrls = await Promise.all((videos || []).map(async (video) => {
        // Ensure we're using just the relative path
        const videoPath = video.url.includes('output-content/') 
          ? video.url.split('output-content/')[1] 
          : video.url
          
        const { data: publicData } = supabase
          .storage
          .from('output-content')
          .getPublicUrl(videoPath)
        return { ...video, url: publicData.publicUrl }
      }))

      setOutputVideos(outputVideosWithUrls)
      setLoadingOutputs(false)
    }

    fetchOutputVideos()
  }, [supabase])

  // Fetch hooks when app is selected
  useEffect(() => {
    async function fetchHooks() {
      if (!selectedAppId) {
        setHooks([])
        setHook('')
        return
      }

      setLoadingHooks(true)
      const { data, error } = await supabase
        .from('hooks')
        .select('*')
        .eq('app_id', selectedAppId)
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
  const handleCreateVideo = async () => {
    if (!selectedAppId) {
      toast({
        title: "App Required",
        description: "Please select an app for your video",
        variant: "destructive"
      })
      return
    }

    if (!hook) {
      toast({
        title: "Hook Required",
        description: "Please select or generate a hook for your video",
        variant: "destructive"
      })
      return
    }

    if (!selectedInfluencerVideo) {
      toast({
        title: "UGC Video Required",
        description: "Please select an influencer video from the grid",
        variant: "destructive"
      })
      return
    }

    if (!selectedDemoVideo) {
      toast({
        title: "Demo Video Required",
        description: "Please upload or select a demo video",
        variant: "destructive"
      })
      return
    }

    if (isPending) {
      return
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return
    }

    // Check content remaining
    if (contentRemaining <= 0) {
      setShowUpgradeModal(true)
      return
    }

    // Validate required fields
    const missingFields = []
    if (!selectedInfluencerVideo) missingFields.push('influencer video')
    if (!selectedDemoVideo) missingFields.push('demo video')
    if (!hook) missingFields.push('caption text')

    if (missingFields.length > 0) {
      return
    }

    // Check and increment content usage
    const canCreate = await incrementContentUsage(user.id)
    if (!canCreate) {
      toast({
        title: "Monthly limit reached",
        description: "You've reached your monthly content creation limit. Please upgrade your plan to create more content.",
        variant: "destructive"
      })
      return
    }

    // Create a pending video object
    const pendingVideoObj = {
      id: crypto.randomUUID(),
      status: 'pending',
      created_at: new Date().toISOString(),
      app_id: selectedAppId,
      user_id: user.id
    }
    
    // Add the pending video to the list
    setOutputVideos(prev => [pendingVideoObj, ...prev])
    setPendingVideo(pendingVideoObj)

    startTransition(async () => {
      try {
        const result = await createVideo({
          influencerVideoUrl: selectedInfluencerVideo,
          demoFootageUrl: selectedDemoVideo,
          captionText: hook,
          captionPosition: textPosition,
          userUuid: user.id,
          app_id: selectedAppId
        })

        if ('error' in result) {
          // Remove the pending video if there was an error
          setOutputVideos(prev => prev.filter(v => v.id !== pendingVideoObj.id))
          setPendingVideo(null)
          return
        } else {
          setSelectedVideo(null)
          setSelectedDemoVideo('')
          setHook('')
          setPendingVideo(null)
          // Fetch the updated video list
          fetchOutputVideos()
        }
      } catch (error) {
        console.error('Error creating video:', error)
        // Remove the pending video if there was an error
        setOutputVideos(prev => prev.filter(v => v.id !== pendingVideoObj.id))
        setPendingVideo(null)
      }
    })
  }

  const handleUGCVideoSelect = (num: number) => {
    setSelectedVideo(num)
    setSelectedInfluencerVideo(getUGCVideoUrl(num))
  }

  const handleDemoVideoSelect = (url: string) => {
    setSelectedDemoVideo(url)
  }

  const handleDeleteVideo = (id: string) => {
    setOutputVideos(videos => videos.filter(video => video.id !== id))
  }

  // Effect for setting default selections
  useEffect(() => {
    // Set default video selection (first video)
    if (!selectedInfluencerVideo && videosToShow.length > 0) {
      setSelectedVideo(videosToShow[0])
      setSelectedInfluencerVideo(`/videos/${videosToShow[0]}.mp4`)
    }

    // Set default demo video (first demo)
    if (!selectedDemoVideo && demoVideos.length > 0 && !loadingDemos) {
      setSelectedDemo(demoVideos[0].id)
      setSelectedDemoVideo(demoVideos[0].publicUrl)
    }
  }, [demoVideos, loadingDemos, selectedDemoVideo, selectedInfluencerVideo, videosToShow])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-card border-border">
          <SubscriptionGuard>
            <div className="space-y-8">
              {/* App Selection */}
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>1. Select your app</CardTitle>
                  <CardDescription>Choose the app you want to create content for</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

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
                  <p className="text-muted-foreground text-center">No hooks available. Add hooks in the Hooks section.</p>
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
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {videosToShow.map((videoNumber) => (
                        <div
                          key={videoNumber}
                          onClick={() => handleUGCVideoSelect(videoNumber)}
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
                              style={{
                                background: textPosition === 'top' ? 
                                  'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)' :
                                  textPosition === 'bottom' ? 
                                  'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)' :
                                  'rgba(0,0,0,0.5)'
                              }}
                            >
                              <p className="text-white text-sm font-medium drop-shadow-lg whitespace-pre-wrap" style={{ fontFamily: 'TikTokDisplay' }}>
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
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>4. Demos</CardTitle>
                  <CardDescription>Upload your product demo videos</CardDescription>
                </CardHeader>
                <CardContent>
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
                            onClick={() => handleDemoVideoSelect(video.publicUrl)}
                            className={`relative flex-shrink-0 cursor-pointer group transition-all duration-200 rounded-lg overflow-hidden ${
                              selectedDemoVideo === video.publicUrl 
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg' 
                                : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md'
                            }`}
                            style={{ width: '100px' }}
                          >
                            <div className="aspect-[9/16] w-full rounded-lg overflow-hidden">
                              <video
                                key={video.publicUrl}
                                src={video.publicUrl}
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
                </CardContent>
              </Card>
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
        </Card>
        
        {/* My Videos Section */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">My Videos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loadingOutputs ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : outputVideos.length === 0 ? (
              <p className="text-muted-foreground text-center">No videos created yet. Create your first video above!</p>
            ) : (
              outputVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
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
        />
      </div>
    </div>
  )
}