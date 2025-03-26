'use client'

import { Heading } from '@/components/ui/heading'
import { Card, CardContent } from '@/components/ui/card'
import { InfluencerPrompt } from '@/components/dashboard/influencers/InfluencerPrompt'

export default function InfluencersPage() {
  return (
    <div className="flex-1 space-y-4 p-6 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Influencers" description="Create custom influencers for your app" />
      </div>

      <Card className="overflow-hidden border-border">
        <CardContent className="p-6">
          <InfluencerPrompt />
        </CardContent>
      </Card>
    </div>
  )
} 