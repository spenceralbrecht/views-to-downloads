'use client'

import { CreditCard, AppWindow, Video } from "lucide-react"
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import PricingModal from '@/components/PricingModal'

interface OnboardingChecklistProps {
  hasSubscription: boolean
  hasApp: boolean
  hasDemoVideo: boolean
  billingUrl: string
}

export function OnboardingChecklist({ hasSubscription, hasApp, hasDemoVideo, billingUrl }: OnboardingChecklistProps) {
  const [showPricingModal, setShowPricingModal] = useState(false)

  return (
    <div className="grid gap-4 mb-8">
      <div 
        onClick={() => !hasSubscription && setShowPricingModal(true)} 
        className={!hasSubscription ? 'cursor-pointer' : 'cursor-default'}
      >
        <div className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg transition-colors ${!hasSubscription ? 'hover:bg-accent/50' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${hasSubscription ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium">Subscription required</h3>
              <p className="text-sm text-muted-foreground">Estimated 2-3 minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasSubscription ? (
              <Badge variant="outline" className="bg-primary/20 text-primary border-0">
                Complete
              </Badge>
            ) : (
              <Button variant="ghost" size="sm" className="text-primary">
                Start →
              </Button>
            )}
          </div>
        </div>
      </div>

      <Link href={hasApp ? '#' : '/dashboard/apps'} className={!hasApp ? 'cursor-pointer' : 'cursor-default'}>
        <div className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg transition-colors ${!hasApp ? 'hover:bg-accent/50' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${hasApp ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <AppWindow className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium">Add your first app</h3>
              <p className="text-sm text-muted-foreground">Estimated 30 seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasApp ? (
              <Badge variant="outline" className="bg-primary/20 text-primary border-0">
                Complete
              </Badge>
            ) : (
              <Button variant="ghost" size="sm" className="text-primary">
                Start →
              </Button>
            )}
          </div>
        </div>
      </Link>

      <Link href={hasDemoVideo ? '#' : '/dashboard/videos'} className={!hasDemoVideo ? 'cursor-pointer' : 'cursor-default'}>
        <div className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg transition-colors ${!hasDemoVideo ? 'hover:bg-accent/50' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${hasDemoVideo ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium">Upload demo video</h3>
              <p className="text-sm text-muted-foreground">Estimated 1 minute</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasDemoVideo ? (
              <Badge variant="outline" className="bg-primary/20 text-primary border-0">
                Complete
              </Badge>
            ) : (
              <Button variant="ghost" size="sm" className="text-primary">
                Start →
              </Button>
            )}
          </div>
        </div>
      </Link>

      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </div>
  )
}
