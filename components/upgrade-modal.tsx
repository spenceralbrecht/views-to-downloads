'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getStripeConfig } from '@/config/stripe'
import { useSubscription } from '@/hooks/useSubscription'
import { useUser } from '@supabase/auth-helpers-react'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const user = useUser()
  const { plan } = useSubscription(user)

  // Get the next tier's payment link
  const getUpgradeLink = () => {
    const stripeConfig = getStripeConfig()
    if (stripeConfig.env === 'development') {
      switch (plan) {
        case 'starter':
          return stripeConfig.testGrowthLink
        case 'growth':
          return stripeConfig.testScaleLink
        default:
          return stripeConfig.testStarterLink
      }
    } else {
      switch (plan) {
        case 'starter':
          return stripeConfig.growthLink
        case 'growth':
          return stripeConfig.scaleLink
        default:
          return stripeConfig.starterLink
      }
    }
  }

  const handleUpgrade = () => {
    const upgradeLink = getUpgradeLink()
    if (upgradeLink) {
      window.location.href = upgradeLink
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            You've reached your monthly content creation limit. Upgrade your plan to create more content and unlock additional features.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Next Tier Benefits:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Increased monthly content creation limit</li>
              <li>Priority processing</li>
              <li>Advanced analytics</li>
              <li>Premium support</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade} className="btn-gradient">
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
