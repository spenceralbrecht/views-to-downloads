'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { uploadDemoVideo } from '../actions'

export default function CreateAd() {
  const [hook, setHook] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Generate an array of 69 videos, numbered 1..69
  const allVideos = Array.from({ length: 69 }, (_, i) => i + 1)

  // Pagination setup
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Create UGC ads</h1>

      <Card className="p-6 bg-gray-50">
        <div className="space-y-8">
          {/* Hook Section */}
          <div>
            <div className="flex justify-between mb-2">
              <h2 className="font-medium">1. Hook</h2>
              <span className="text-gray-500">{hook.length}/30</span>
            </div>
            <div className="relative">
              <Input
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                maxLength={30}
                className="pr-8 bg-white"
                placeholder="Enter your hook text..."
              />
              <div className="absolute inset-y-0 right-2 flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
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
                    onClick={() => setSelectedVideo(num)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedVideo === num
                        ? 'border-blue-500'
                        : 'border-transparent'
                    }`}
                  >
                    <video
                      src={`https://views-to-downloads.s3.us-east-2.amazonaws.com/${num}.mp4`}
                      preload="metadata"
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
                <video
                  src={`https://views-to-downloads.s3.us-east-2.amazonaws.com/${selectedVideo}.mp4`}
                  autoPlay
                  playsInline
                  muted
                  className="w-1/2 h-auto object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          {/* Demos Section */}
          <div>
            <h2 className="font-medium mb-2">3. Demos</h2>
            <div className="flex gap-2">
              <button className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                None
              </button>
              {[1, 2, 3].map((demo) => (
                <button
                  key={demo}
                  className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden"
                >
                  <img
                    src={`/placeholder.svg?height=96&width=96`}
                    alt={`Demo ${demo}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
          
              {/* New upload form for a demo video */}
              <form action={uploadDemoVideo} encType="multipart/form-data">
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
                        e.currentTarget.form?.requestSubmit();
                      });
                    }
                  }}
                />
              </form>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="mt-8 flex justify-end">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="gap-2">
              <img
                src="/placeholder.svg?height=24&width=24"
                alt="Sound"
                className="w-6 h-6 rounded"
              />
              Sound
            </Button>
            <Button className="bg-[#4287f5]">
              Create
            </Button>
          </div>
        </div>
      </Card>

      {/* My Videos Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My Videos (1)</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Page 1 of 1</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-100">
            <img
              src="/placeholder.svg?height=400&width=225"
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  )
}