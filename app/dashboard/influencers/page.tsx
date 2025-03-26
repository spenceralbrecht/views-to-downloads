'use client'

import { useState } from 'react'
import { Heading } from '@/components/ui/heading'
import { Card, CardContent } from '@/components/ui/card'
import { InfluencerPrompt } from '@/components/dashboard/influencers/InfluencerPrompt'
import { ImageResultsView } from '@/components/dashboard/influencers/ImageResultsView'
import { Button } from '@/components/ui/button'

export default function InfluencersPage() {
  const [promptData, setPromptData] = useState<{
    age?: string
    gender?: string
    ethnicity?: string
    emotion?: string
    feature?: string
  } | null>(null)
  
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async (data: typeof promptData) => {
    if (!data) return
    
    setPromptData(data)
    setIsLoading(true)
    setShowResults(true)
  }

  const handleBackToPrompt = () => {
    setShowResults(false)
    setIsLoading(false)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Influencers" description="Create and manage influencer images" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {!showResults ? (
            <InfluencerPrompt onSubmit={handleCreate} />
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackToPrompt}
                className="mb-4"
              >
                ← Back to Prompt
              </Button>
              <ImageResultsView 
                promptData={promptData} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 