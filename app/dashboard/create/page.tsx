'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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

interface Hook {
  id: string
  hook_text: string
}

export default function CreateAd() {
  const supabase = createClientComponentClient()
  const [isPending, startTransition] = useTransition()
  const user = useUser()
  const { isSubscribed } = useSubscription(user)
  const { toast } = useToast()

  // State for app selection
  const [selectedAppId, setSelectedAppId] = useState<string>('')

  // State for hooks
  const [hooks, setHooks] = useState<Hook[]>([])
  const [currentHookIndex, setCurrentHookIndex] = useState(0)
  const [loadingHooks, setLoadingHooks] = useState(false)
  const [hook, setHook] = useState('')
  const [textPosition, setTextPosition] = useState<'top' | 'middle' | 'bottom'>('bottom')

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

  // Generate an array of 69 videos
  const allVideos = Array.from({ length: 69 }, (_, i) => i + 1)

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
        const { data: publicData } = supabase
          .storage
          .from('output-content')
          .getPublicUrl(video.url)
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

    if (!selectedAppId) {
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Create UGC ads</h1>
      
      <Card className="p-6 bg-gray-50">
        <div className="space-y-8">
          {/* App Selection Section */}
          <div>
            <h2 className="font-medium mb-2">1. Select App</h2>
            <AppSelect
              selectedAppId={selectedAppId}
              onSelect={setSelectedAppId}
            />
          </div>

          {/* Hook Section */}
          <div>
            <div className="flex justify-between mb-2">
              <h2 className="font-medium">2. Hook</h2>
              <span className="text-gray-500">
                {hooks.length > 0 && `Hook ${currentHookIndex + 1} of ${hooks.length}`}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentHookIndex(currentHookIndex - 1)}
                disabled={currentHookIndex === 0 || hooks.length === 0 || loadingHooks}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  maxLength={100}
                  className="pr-24 bg-white"
                  placeholder={loadingHooks ? "Loading hooks..." : hooks.length === 0 ? "No hooks found for this app" : "Enter your hook text..."}
                  disabled={loadingHooks}
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  <Button
                    variant={textPosition === 'top' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextPosition('top')}
                  >
                    Top
                  </Button>
                  <Button
                    variant={textPosition === 'middle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextPosition('middle')}
                  >
                    Middle
                  </Button>
                  <Button
                    variant={textPosition === 'bottom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextPosition('bottom')}
                  >
                    Bottom
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentHookIndex(currentHookIndex + 1)}
                disabled={currentHookIndex === hooks.length - 1 || hooks.length === 0 || loadingHooks}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* UGC Video Section */}
          <div className="flex">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <h2 className="font-medium">3. UGC video</h2>
                <span className="text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {videosToShow.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleUGCVideoSelect(num)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedVideo === num
                        ? 'border-blue-500'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={`https://views-to-downloads.s3.us-east-2.amazonaws.com/thumbnail-${num}.png`}
                      alt={`UGC Video ${num}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={handlePrev} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleNext} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Video Preview Section */}
            <div className="flex-1 ml-4">
              {selectedVideo !== null && (
                <div className="relative w-1/2">
                  <video
                    src={getUGCVideoUrl(selectedVideo)}
                    autoPlay
                    playsInline
                    loop
                    muted
                    className="w-full h-auto object-cover rounded-lg"
                  />
                  {hook && (
                    <div className={`absolute inset-0 flex ${
                      textPosition === 'top' ? 'items-start pt-4' : 
                      textPosition === 'bottom' ? 'items-end pb-4' : 'items-center'
                    } justify-center p-2 text-center`}>
                      <p className="text-white text-xl font-semibold drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] whitespace-pre-wrap">
                        {hook}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Demos Section */}
          <div>
            <h2 className="font-medium mb-2">4. Demos</h2>
            <div className="flex gap-2 items-center">
              {/* New upload form for a demo video */}
              <form action={uploadDemoVideo}>
                <label
                  htmlFor="demoVideo"
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer"
                >
                  {isUploadingDemo ? (
                    <Loader2 className="animate-spin h-6 w-6" />
                  ) : (
                    '+'
                  )}
                </label>
                <input
                  id="demoVideo"
                  name="videoFile"
                  type="file"
                  accept="video/mp4"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) {
                      if (!file.type.includes('mp4')) {
                        e.currentTarget.value = '';
                        return;
                      }
                      startDemoUpload(() => {
                        e.currentTarget.form?.requestSubmit()
                      })
                    }
                  }}
                />
              </form>
              {/* Display uploaded demo videos */}
              <div className="flex gap-2 overflow-x-auto">
                {loadingDemos ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : demoVideos.length > 0 ? (
                  demoVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleDemoVideoSelect(video.publicUrl)}
                      className={`relative w-48 h-48 rounded-lg overflow-hidden border ${selectedDemoVideo === video.publicUrl ? 'outline outline-2 outline-blue-500' : ''}`}
                    >
                      <video
                        key={video.publicUrl}
                        src={video.publicUrl}
                        preload="auto"
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No demos uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="gap-2" type="button">
              <img
                src="/placeholder.svg?height=24&width=24"
                alt="Sound"
                className="w-6 h-6 rounded"
              />
              Sound
            </Button>
            <SubscriptionGuard>
              <ContentLimitGuard>
                <Button 
                  type="button" 
                  className="bg-[#4287f5] hover:bg-[#3270d8] text-white" 
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
            </SubscriptionGuard>
          </div>
        </div>
      </Card>
      
      {/* My Videos Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">My Videos</h2>
        {loadingOutputs ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : outputVideos.length === 0 ? (
          <p className="text-gray-500 text-center">No videos created yet. Create your first video above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outputVideos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onDelete={handleDeleteVideo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}