'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { uploadDemoVideo, createVideo, getHooks } from '../actions'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { VideoCard } from '@/components/video-card'
import { AppSelect } from '@/components/app-select'
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface OutputContent {
  id: string
  url: string
  created_at: string
  status: string
}

interface Hook {
  id: string
  hook_text: string
}

function VideoSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Card>
  )
}

export default function CreateAd() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [hooks, setHooks] = useState<Hook[]>([])
  const [currentHookIndex, setCurrentHookIndex] = useState(0)
  const [isLoadingHooks, setIsLoadingHooks] = useState(false)
  const [isCreatingVideo, setIsCreatingVideo] = useState(false)
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null)
  const [outputVideos, setOutputVideos] = useState<OutputContent[]>([])
  const [textPosition, setTextPosition] = useState<'top' | 'middle' | 'bottom'>('middle')
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Load hooks when app is selected
  useEffect(() => {
    async function loadHooks() {
      if (!selectedAppId) {
        setHooks([])
        return
      }

      setIsLoadingHooks(true)
      const { data, error } = await getHooks(selectedAppId)
      
      if (error) {
        toast({
          title: "Error loading hooks",
          description: error,
          variant: "destructive",
        })
      } else if (data) {
        setHooks(data)
        setCurrentHookIndex(0) // Reset to first hook
      }
      setIsLoadingHooks(false)
    }
    loadHooks()
  }, [selectedAppId, toast])

  // Poll for video status when there's a pending video
  useEffect(() => {
    if (!pendingVideoId) return

    const interval = setInterval(async () => {
      const { data: video } = await supabase
        .from('output_content')
        .select('*')
        .eq('id', pendingVideoId)
        .single()

      if (video && video.status === 'completed') {
        setPendingVideoId(null)
        setIsCreatingVideo(false)
        setOutputVideos(prev => [video, ...prev])
        toast({
          title: "Video created",
          description: "Your video has been created successfully.",
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [pendingVideoId, supabase, toast])

  const handlePrevHook = () => {
    setCurrentHookIndex(i => i > 0 ? i - 1 : i)
  }

  const handleNextHook = () => {
    setCurrentHookIndex(i => i < hooks.length - 1 ? i + 1 : i)
  }

  const handleCreate = async () => {
    if (!selectedAppId || !hooks[currentHookIndex]) return

    setIsCreatingVideo(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create videos",
        variant: "destructive",
      })
      return
    }

    const result = await createVideo(
      "influencer-video-url",
      "demo-video-url",
      hooks[currentHookIndex].hook_text,
      textPosition,
      selectedAppId
    )

    if (result.error) {
      toast({
        title: "Error creating video",
        description: result.error,
        variant: "destructive",
      })
      setIsCreatingVideo(false)
    } else if (result.video) {
      setPendingVideoId(result.video.id)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Create UGC ads</h1>

      <div className="space-y-8">
        {/* Step 1: Select App */}
        <div>
          <h2 className="text-lg font-medium mb-4">1. Select App</h2>
          <AppSelect
            value={selectedAppId}
            onChange={setSelectedAppId}
          />
        </div>

        {/* Step 2: Hook */}
        <div>
          <h2 className="text-lg font-medium mb-4">2. Hook</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevHook}
              disabled={!selectedAppId || currentHookIndex === 0 || hooks.length === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1">
              <Input
                placeholder={isLoadingHooks ? "Loading hooks..." : "Select an app to see hooks"}
                value={hooks[currentHookIndex]?.hook_text || ''}
                readOnly
                className="w-full"
                disabled={!selectedAppId || isLoadingHooks}
              />
              {hooks.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Hook {currentHookIndex + 1} of {hooks.length}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextHook}
              disabled={!selectedAppId || currentHookIndex === hooks.length - 1 || hooks.length === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Step 3: Text Position */}
        <div>
          <h2 className="text-lg font-medium mb-4">3. Text Position</h2>
          <div className="flex gap-2">
            <Button
              variant={textPosition === 'top' ? 'default' : 'outline'}
              onClick={() => setTextPosition('top')}
            >
              Top
            </Button>
            <Button
              variant={textPosition === 'middle' ? 'default' : 'outline'}
              onClick={() => setTextPosition('middle')}
            >
              Middle
            </Button>
            <Button
              variant={textPosition === 'bottom' ? 'default' : 'outline'}
              onClick={() => setTextPosition('bottom')}
            >
              Bottom
            </Button>
          </div>
        </div>

        {/* Create Button */}
        <div>
          <Button 
            onClick={handleCreate}
            disabled={!selectedAppId || isCreatingVideo}
            className="w-full"
          >
            {isCreatingVideo ? 'Creating...' : 'Create Video'}
          </Button>
        </div>

        {/* Videos Section */}
        <div>
          <h2 className="text-lg font-medium mb-4">Your Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isCreatingVideo && <VideoSkeleton />}
            {outputVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}