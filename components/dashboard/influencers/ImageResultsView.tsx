'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { fal } from '@fal-ai/client'
import { Loader2 } from 'lucide-react'

// Initialize fal client with API key directly
fal.config({
  credentials: '3e858b41-fbf7-463d-8381-c5f809db884f:a4de9547b72453eae0bb225f6078bce7'
})

interface ImageResultsViewProps {
  promptData: {
    age?: string
    gender?: string
    ethnicity?: string 
    emotion?: string
    feature?: string
  } | null
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

interface FalImage {
  url: string
  content_type: string
}

interface FalResponse {
  images: FalImage[]
  prompt: string
  seed?: number
  has_nsfw_concepts?: boolean[]
}

export function ImageResultsView({ 
  promptData, 
  isLoading, 
  setIsLoading 
}: ImageResultsViewProps) {
  const [images, setImages] = useState<FalImage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const generateImages = async () => {
      if (!promptData) return
      
      try {
        setError(null)
        
        // Construct a detailed prompt from the dropdown selections
        const { age, gender, ethnicity, emotion, feature } = promptData
        const basePrompt = `A a ${age} year old ${ethnicity} ${gender} with ${emotion} expression${feature ? ` and ${feature}` : ''} taking a selfie.`
        const enhancedPrompt = `${basePrompt} organic UGC tiktok content, no filters, no editing, medium shot.`
        
        console.log('Sending prompt to Fal AI:', enhancedPrompt)
        
        // Send request to Fal AI
        const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
          input: {
            prompt: enhancedPrompt,
            num_images: 4,
            aspect_ratio: "9:16"
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log)
            }
          },
        })
        
        console.log('Results received:', result.data)
        
        if (isMounted) {
          const responseData = result.data as FalResponse
          if (responseData && responseData.images) {
            setImages(responseData.images)
          } else {
            setError('Failed to generate images')
          }
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error generating images:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error generating images. Please try again.')
          setIsLoading(false)
        }
      }
    }

    if (isLoading && promptData) {
      generateImages()
    }

    return () => {
      isMounted = false
    }
  }, [promptData, isLoading, setIsLoading])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Generating influencer images...</p>
        <p className="text-xs text-muted-foreground mt-2">This may take up to 30 seconds</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="relative aspect-[9/16] overflow-hidden rounded-md border border-border"
          >
            <Image
              src={image.url}
              alt={`Generated influencer ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>
      
      {images.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          <p>Generated {images.length} influencer images</p>
        </div>
      )}
    </div>
  )
} 