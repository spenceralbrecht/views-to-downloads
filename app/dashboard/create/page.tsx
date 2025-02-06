'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { uploadDemoVideo, createVideo } from '../actions'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface OutputContent {
  id: string
  url: string
  created_at: string
  status: string
}

function VideoCard({ video }: { video: OutputContent }) {
  return (
    <Card className="p-4 space-y-2">
      <video 
        src={video.url} 
        controls 
        className="w-full rounded-lg"
        style={{ maxHeight: '400px' }}
      />
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Created: {new Date(video.created_at).toLocaleDateString()}</span>
        <span>Status: {video.status}</span>
      </div>
    </Card>
  )
}

export default function CreateAd() {
  const [hook, setHook] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<number | null>(1)
  const [isPending, startTransition] = useTransition()
  const [textPosition, setTextPosition] = useState<'top' | 'middle' | 'bottom'>('middle')
  const supabase = createClientComponentClient()
  
  // For demo videos
  const [demoVideos, setDemoVideos] = useState<Array<any>>([])
  const [loadingDemos, setLoadingDemos] = useState(true)
  const [selectedDemo, setSelectedDemo] = useState(null)
  
  // For output videos
  const [outputVideos, setOutputVideos] = useState<OutputContent[]>([])
  const [loadingOutputs, setLoadingOutputs] = useState(true)

  const [selectedInfluencerVideo, setSelectedInfluencerVideo] = useState<string>('');
  const [selectedDemoVideo, setSelectedDemoVideo] = useState<string>('');
  const [captionText, setCaptionText] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error fetching user:', error)
      }
    }
    getUser()
  }, [supabase])

  // Generate an array of 69 videos
  const allVideos = Array.from({ length: 69 }, (_, i) => i + 1)

  // Pagination setup for the UGC videos (not demos)
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
  
  // Fetch demo videos from the input_content table and convert file paths to public URLs
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
        const demoVideosWithUrls = data.map((video) => {
          const { data: publicData } = supabase
            .storage
            .from('input-content')
            .getPublicUrl(video.content_url)
          console.log('Demo video public URL:', publicData.publicUrl)
          return { ...video, publicUrl: publicData.publicUrl }
        })
        setDemoVideos(demoVideosWithUrls)
      }
      setLoadingDemos(false)
    }
    fetchDemoVideos()
  }, [])

  // Fetch user's output videos
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

      setOutputVideos(videos)
      setLoadingOutputs(false)
    }

    fetchOutputVideos()
  }, [supabase])

  // Add new state variables for finished videos
  const [finishedVideos, setFinishedVideos] = useState<{ id: string; loading: boolean }[]>([]);
  const [loadingFinished, setLoadingFinished] = useState(true);

  useEffect(() => {
    async function fetchFinishedVideos() {
      setLoadingFinished(true);
      try {
        const res = await fetch('/api/finished-videos');
        const json = await res.json();
        if (json.error) {
          console.error('Error fetching finished videos:', json.error);
        } else {
          setFinishedVideos(json.data || []);
        }
      } catch (e) {
        console.error(e);
      }
      setLoadingFinished(false);
    }
    fetchFinishedVideos();
  }, []);

  // Add this function to construct the UGC video URL
  const getUGCVideoUrl = (videoNumber: number | null) => {
    if (!videoNumber) return '';
    return `https://views-to-downloads.s3.us-east-2.amazonaws.com/${videoNumber}.mp4`;
  };

  const handleCreate = async () => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('Error getting user:', userError)
      return
    }
    if (!user) {
      console.error('No authenticated user found')
      return
    }

    // Get the app ID for this user
    const { data: apps, error: appsError } = await supabase
      .from('apps')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (appsError) {
      console.error('Error getting app:', appsError)
      return
    }

    if (!apps?.id) {
      console.error('No app found for user')
      return
    }

    const influencerVideoUrl = getUGCVideoUrl(selectedVideo);
    
    // Validate all required fields
    const missingFields = [];
    if (!selectedVideo) missingFields.push('influencer video');
    if (!selectedDemoVideo) missingFields.push('demo video');
    if (!captionText) missingFields.push('caption text');

    if (missingFields.length > 0) {
      alert(`Please provide the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Start the loading state
    startTransition(async () => {
      try {
        const result = await createVideo({
          influencer_video_url: influencerVideoUrl,
          demo_footage_url: selectedDemoVideo,
          captions: captionText,
          user_uuid: user.id,
          app_id: apps.id
        });

        if (result.error) {
          alert(`Error creating video: ${result.error}`);
        } else {
          // Clear form and show success message
          setSelectedVideo(null);
          setSelectedDemoVideo('');
          setCaptionText('');
          alert('Video created successfully!');
        }
      } catch (error) {
        console.error('Error creating video:', error);
        alert('An unexpected error occurred while creating the video.');
      }
    });
  };

  const handleUGCVideoSelect = (num: number) => {
    setSelectedVideo(num);
    setSelectedInfluencerVideo(getUGCVideoUrl(num));
  }

  const handleDemoSelect = (video: any) => {
    setSelectedDemo(video.id);
    setSelectedDemoVideo(video.publicUrl);
  }

  useEffect(() => {
    setCaptionText(hook);
  }, [hook]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Create UGC ads</h1>
      
      <Card className="p-6 bg-gray-50">
        <div className="space-y-8">
          {/* Hook Section */}
          <div>
            <div className="flex justify-between mb-2">
              <h2 className="font-medium">1. Hook</h2>
              <span className="text-gray-500">{hook.length}/100</span>
            </div>
            <div className="relative">
              <Input
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                maxLength={100}
                className="pr-8 bg-white"
                placeholder="Enter your hook text..."
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
          </div>
          
          {/* UGC Video Section */}
          <div className="flex">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <h2 className="font-medium">2. UGC video</h2>
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
                    <video
                      src={`https://views-to-downloads.s3.us-east-2.amazonaws.com/${num}.mp4`}
                      preload="metadata"
                      className="w-full h-full object-cover"
                      onLoadedData={(e) => {
                        const video = e.currentTarget;
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                          const dataUrl = canvas.toDataURL();
                          video.parentElement.style.backgroundImage = `url(${dataUrl})`;
                        }
                      }}
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
            <h2 className="font-medium mb-2">3. Demos</h2>
            <div className="flex gap-2 items-center">
              {/* New upload form for a demo video */}
              <form action={uploadDemoVideo}>
                <label
                  htmlFor="demoVideo"
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="animate-spin h-6 w-6" />
                  ) : (
                    '+'
                  )}
                </label>
                <input
                  id="demoVideo"
                  name="videoFile"
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.currentTarget.files?.[0]) {
                      startTransition(() => {
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
                      onClick={() => handleDemoSelect(video)}
                      className={`relative w-48 h-48 rounded-lg overflow-hidden border ${selectedDemo === video.id ? 'outline outline-2 outline-blue-500' : ''}`}
                    >
                      <video
                        src={video.publicUrl}
                        preload="metadata"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
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
            <Button type="button" className="bg-[#4287f5]" onClick={handleCreate}>
              Create
            </Button>
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
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}