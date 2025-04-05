import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Eye, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useRef } from 'react'

interface ViralFormatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  format?: Format
}

interface VideoExample {
  url: string
  platform: "tiktok" | "instagram"
  views: number
  view_url: string
}

interface Format {
  id: string
  name: string
  difficulty: string
  how_it_works: string
  examples: VideoExample[]
  requires: string[]
}

function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`
  }
  return `${views} views`
}

export function ViralFormatModal({ open, onOpenChange, format: initialFormat }: ViralFormatModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [format, setFormat] = useState<Format | null>(initialFormat || null)
  const [isLoading, setIsLoading] = useState(!initialFormat)

  useEffect(() => {
    if (initialFormat) {
      const processedFormat = { ...initialFormat };
      
      if (typeof processedFormat.examples === 'string') {
        try {
          processedFormat.examples = JSON.parse(processedFormat.examples);
        } catch (e) {
          console.error('Error parsing examples JSON:', e);
          processedFormat.examples = [];
        }
      }
      
      if (!processedFormat.examples || !Array.isArray(processedFormat.examples)) {
        processedFormat.examples = [];
      }

      if (!processedFormat.requires || !Array.isArray(processedFormat.requires)) {
        processedFormat.requires = [];
      }
      
      console.log('Processed Format:', processedFormat);
      
      setFormat(processedFormat);
    }
  }, [initialFormat])

  useEffect(() => {
    if (open && !initialFormat) {
      async function fetchFormat() {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('formats')
          .select('*')
          .eq('id', '2e85750d-a34c-48e0-9089-533265e5956e')
          .single()

        if (data) {
          setFormat(data)
        }
        setIsLoading(false)
      }
      fetchFormat()
    }
  }, [open, supabase, initialFormat])

  const handleUseFormat = () => {
    router.push('/dashboard/create')
    onOpenChange(false)
  }

  const handleVideoHover = (videoElement: HTMLVideoElement) => {
    videoElement.play().catch(error => {
      console.log("Autoplay failed:", error)
    })
  }

  const handleVideoLeave = (videoElement: HTMLVideoElement) => {
    videoElement.pause()
  }

  if (!format && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!format) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-border">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-6 py-6 px-1.5">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-text">{format.name}</h2>
              <Badge variant="outline" className={`text-white border-none py-1 px-4 rounded-full text-sm ${
                format.difficulty === 'Medium' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                  : format.difficulty === 'Hard'
                  ? 'bg-gradient-to-r from-red-500 to-rose-500'
                  : 'bg-primary/70'
              }`}>
                {format.difficulty} Difficulty
              </Badge>
            </div>

            <div className="h-px bg-border w-full my-6"></div>

            {/* How it Works Section */}
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-text">How it Works</h3>
              <p className="text-textMuted">{format.how_it_works}</p>
            </div>

            {/* Requires Section */}
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-text">Requires</h3>
              <ul className="list-disc list-inside text-textMuted pl-1">
                {Array.isArray(format.requires) && format.requires.length > 0 ? (
                  format.requires.map((requirement, index) => (
                    <li key={index} className="mb-2">{requirement}</li>
                  ))
                ) : (
                  <li className="mb-2">No specific requirements</li>
                )}
              </ul>
            </div>

            {/* Viral Examples Section */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-text">Viral Examples</h3>
              <div className="grid grid-cols-3 gap-4">
                {Array.isArray(format.examples) && format.examples.length > 0 ? (
                  format.examples.map((example, index) => (
                    <div 
                      key={index}
                      className="group relative"
                    >
                      <div 
                        className="aspect-[9/16] rounded-lg overflow-hidden relative"
                        onMouseEnter={(e) => {
                          const video = e.currentTarget.querySelector('video')
                          if (video) handleVideoHover(video)
                        }}
                        onMouseLeave={(e) => {
                          const video = e.currentTarget.querySelector('video')
                          if (video) handleVideoLeave(video)
                        }}
                      >
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-sm z-30 bg-black/50 px-2 rounded-md">
                          <Eye className="w-4 h-4" />
                          <span>{formatViewCount(example.views)}</span>
                        </div>
                        <video
                          src={example.view_url}
                          className="w-full h-full object-cover"
                          loop
                          playsInline
                          muted
                          preload="metadata"
                        />
                        <a 
                          href={example.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
                        >
                          <span className="text-white text-sm font-medium">Watch on {example.platform === "tiktok" ? "TikTok" : "Instagram"}</span>
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10 bg-gray-800/30 rounded-lg">
                    <p className="text-textMuted">No examples available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-6 border-t border-border">
          <Button 
            onClick={handleUseFormat}
            className="btn-gradient py-3 px-8 rounded-full text-base font-medium"
          >
            Use This Format
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 