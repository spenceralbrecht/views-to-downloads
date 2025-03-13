'use client'

import { CreditCard, Smartphone, Video, Anchor } from "lucide-react"
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import PricingModal from '@/components/PricingModal'
import { trackStripeCheckout } from '@/utils/tracking'
import { useUser } from '@supabase/auth-helpers-react'

interface OnboardingChecklistProps {
  hasSubscription: boolean
  hasApp: boolean
  hasDemoVideo: boolean
  hasHooks: boolean
  billingUrl: string
}

export function OnboardingChecklist({ hasSubscription, hasApp, hasDemoVideo, hasHooks, billingUrl }: OnboardingChecklistProps) {
  const [showPricingModal, setShowPricingModal] = useState(false)
  const user = useUser();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Onboarding</h2>
      <div className="grid gap-4">
        <div 
          onClick={() => {
            if (hasSubscription) {
              window.open(billingUrl, '_blank', 'noopener,noreferrer');
            } else {
              trackStripeCheckout(user?.email, 'Onboarding');
              setShowPricingModal(true);
            }
          }} 
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
                <Smartphone className="h-4 w-4" />
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

        <Link href={hasHooks ? '#' : '/dashboard/hooks'} className={!hasHooks ? 'cursor-pointer' : 'cursor-default'}>
          <div className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg transition-colors ${!hasHooks ? 'hover:bg-accent/50' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${hasHooks ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Anchor className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Generate viral hooks</h3>
                <p className="text-sm text-muted-foreground">Estimated 30 seconds</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasHooks ? (
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

        <Link href={hasDemoVideo ? '#' : '/dashboard/create#upload-demo'} className={!hasDemoVideo ? 'cursor-pointer' : 'cursor-default'}>
          <div className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg transition-colors ${!hasDemoVideo ? 'hover:bg-accent/50' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${hasDemoVideo ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Video className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Create your first video</h3>
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
      </div>

      <h2 className="text-xl font-semibold">Create Content</h2>

      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </div>
  )
}
