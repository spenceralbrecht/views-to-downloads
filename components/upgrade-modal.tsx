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

export interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription?: { plan_name?: string } | null
  loading: boolean
}

export function UpgradeModal({ open, onOpenChange, subscription, loading }: UpgradeModalProps) {
  console.log('UpgradeModal open:', open);
  // Derive the plan from the subscription prop
  const plan = subscription?.plan_name || null;
  console.log('UpgradeModal subscription prop:', subscription, 'derived plan:', plan);

  // Get the next tier's payment link
  const getUpgradeLink = () => {
    const stripeConfig = getStripeConfig() as any;
    console.log('Stripe config in getUpgradeLink:', stripeConfig);
    if (!plan) {
      console.error('No active subscription plan found');
      return;
    }
    if (stripeConfig.env === 'development') {
      switch (plan) {
        case 'starter': {
          if (!stripeConfig.testGrowthLink) {
            console.error('testGrowthLink not defined in stripeConfig');
            return;
          }
          return stripeConfig.testGrowthLink;
        }
        case 'growth': {
          if (!stripeConfig.testScaleLink) {
            console.error('testScaleLink not defined in stripeConfig');
            return;
          }
          return stripeConfig.testScaleLink;
        }
        case 'scale':
          console.error('No upgrade available for scale plan in development');
          return;
        default:
          console.error('Unknown plan in development:', plan);
          return;
      }
    } else {
      switch (plan) {
        case 'starter': {
          const nextTierLink = stripeConfig.growthLink || process.env.NEXT_PUBLIC_STRIPE_GROWTH_LINK;
          if (!nextTierLink) {
            console.error('growthLink not defined in stripeConfig or env vars');
            return;
          }
          return nextTierLink;
        }
        case 'growth': {
          const nextTierLink = stripeConfig.scaleLink || process.env.NEXT_PUBLIC_STRIPE_SCALE_LINK;
          if (!nextTierLink) {
            console.error('scaleLink not defined in stripeConfig or env vars');
            return;
          }
          return nextTierLink;
        }
        case 'scale':
          console.error('No upgrade available for scale plan in production');
          return;
        default:
          console.error('Unknown plan in production:', plan);
          return;
      }
    }
  }

  const handleUpgrade = () => {
    console.log('Upgrade modal: Upgrade Now button clicked.');
    console.log('Current plan:', plan);
    const upgradeLink = getUpgradeLink();
    console.log('Retrieved upgrade link:', upgradeLink);
    if (upgradeLink) {
      console.log('Redirecting to upgrade link:', upgradeLink);
      window.location.href = upgradeLink;
      onOpenChange(false);
    } else {
      console.error('No upgrade link available for current plan:', plan);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-[9999]">
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
          <Button onClick={handleUpgrade} className="btn-gradient" disabled={loading}>
            {loading ? 'Loading...' : 'Upgrade Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
