'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function CreateAd() {
  const [hook, setHook] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null)
  
  const avatars = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    src: `/placeholder.svg?height=100&width=100`
  }))

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
          <div>
            <div className="flex justify-between mb-2">
              <h2 className="font-medium">2. UGC video</h2>
              <span className="text-gray-500">1/3</span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedAvatar === avatar.id ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={avatar.src}
                    alt={`Avatar ${avatar.id}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
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
              <button className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                +
              </button>
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

