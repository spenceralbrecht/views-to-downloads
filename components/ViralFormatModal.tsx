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

export function ViralFormatModal({ open, onOpenChange }: ViralFormatModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [format, setFormat] = useState<Format | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

    if (open) {
      fetchFormat()
    }
  }, [open, supabase])

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b flex-shrink-0 mt-3">
          <div className="space-y-2 pr-6">
            <DialogTitle className="text-2xl font-bold">{format.name}</DialogTitle>
            <Badge variant={format.difficulty.toLowerCase() === "easy" ? "success" : "default"} className="text-sm">
              {format.difficulty} Difficulty
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-6 py-4">
            {/* How it Works Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">How it Works</h3>
              <p className="text-muted-foreground">{format.how_it_works}</p>
            </div>

            {/* Requires Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Requires</h3>
              <ul className="list-disc list-inside text-muted-foreground">
                {format.requires.map((requirement, index) => (
                  <li key={index} className="mb-1">{requirement}</li>
                ))}
              </ul>
            </div>

            {/* Viral Examples Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Viral Examples</h3>
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
                {format.examples.map((example, index) => (
                  <div 
                    key={index}
                    className="group relative w-[244px] flex-shrink-0 snap-center"
                  >
                    <Card className="overflow-hidden">
                      <div 
                        className="aspect-[9/16] relative h-[431px]"
                        onMouseEnter={(e) => {
                          const video = e.currentTarget.querySelector('video')
                          if (video) handleVideoHover(video)
                        }}
                        onMouseLeave={(e) => {
                          const video = e.currentTarget.querySelector('video')
                          if (video) handleVideoLeave(video)
                        }}
                      >
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-base z-30">
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
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 bg-background pt-4 border-t -mx-6 px-6">
          <Button 
            onClick={handleUseFormat}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Use This Format
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 