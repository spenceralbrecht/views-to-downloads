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
import { useEffect, useState } from 'react'
import Script from 'next/script'

// Add type declaration for TikTok global
declare global {
  interface Window {
    TikTok?: {
      reload: () => void
    }
  }
}

interface ViralFormatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface VideoExample {
  url: string
  platform: "tiktok" | "instagram"
  views: number
  embedCode?: string
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
  const [tiktokScriptLoaded, setTiktokScriptLoaded] = useState(false)

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

  useEffect(() => {
    if (open && !tiktokScriptLoaded) {
      const script = document.createElement('script')
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      script.onload = () => {
        setTiktokScriptLoaded(true)
      }
      document.body.appendChild(script)
      return () => {
        document.body.removeChild(script)
      }
    }
  }, [open, tiktokScriptLoaded])

  const handleUseFormat = () => {
    router.push('/dashboard/create')
    onOpenChange(false)
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
        <div className="absolute right-2 top-2 z-[100] mb-2">
          <button
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <span className="sr-only">Close</span>
          </button>
        </div>
        <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b flex-shrink-0 mt-3">
          <div className="space-y-2 pr-6">
            <DialogTitle className="text-2xl font-bold">{format.name}</DialogTitle>
            <Badge variant={format.difficulty.toLowerCase() === "easy" ? "success" : "default"} className="text-sm">
              {format.difficulty} Difficulty
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory">
                {format.examples.map((example, index) => (
                  <div 
                    key={index}
                    className="group relative w-[325px] flex-shrink-0 snap-center"
                  >
                    <Card className="overflow-hidden">
                      <div className="aspect-[9/16] relative h-[575px]">
                        {example.platform === "tiktok" ? (
                          <>
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-base z-30">
                              <Eye className="w-4 h-4" />
                              <span>{formatViewCount(example.views)}</span>
                            </div>
                            <TikTokEmbed url={example.url} />
                          </>
                        ) : (
                          <>
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-base z-30">
                              <Eye className="w-4 h-4" />
                              <span>{formatViewCount(example.views)}</span>
                            </div>
                            <iframe
                              className="w-full h-full"
                              src={`https://www.instagram.com/reel/${example.url.split('/').pop()}/embed/`}
                              frameBorder="0"
                              allowFullScreen
                            />
                          </>
                        )}
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

function TikTokEmbed({ url }: { url: string }) {
  const videoId = url.split('/').pop()
  
  useEffect(() => {
    if (window.TikTok) {
      window.TikTok.reload()
    }
  }, [])

  return (
    <div className="w-full h-full">
      <style>{`
        .tiktok-embed {
          margin: 0 !important;
          max-width: none !important;
          min-width: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        .tiktok-embed::before {
          display: none !important;
        }
      `}</style>
      <blockquote 
        className="tiktok-embed w-full h-full" 
        cite={url}
        data-video-id={videoId}
      >
        <section></section>
      </blockquote>
    </div>
  )
} 