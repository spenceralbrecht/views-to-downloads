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
import { trackStripeCheckout } from '@/utils/tracking'
import { useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'

export interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription?: { plan_name?: string } | null
  loading: boolean
}

export function UpgradeModal({ open, onOpenChange, subscription, loading }: UpgradeModalProps) {
  const [error, setError] = useState<string | null>(null)
  const plan = subscription?.plan_name || null;
  const user = useUser();

  // Get the next tier's payment link
  const getUpgradeLink = () => {
    try {
      const stripeConfig = getStripeConfig(user?.email);
      
      if (!stripeConfig.customerBillingLink) {
        throw new Error('Customer billing link not defined in stripeConfig');
      }
      
      return stripeConfig.customerBillingLink;
    } catch (error) {
      console.error('Error getting upgrade link:', error);
      throw error;
    }
  }

  const handleUpgrade = () => {
    try {
      setError(null);
      const upgradeLink = getUpgradeLink();
      trackStripeCheckout(user?.email, 'Upgrade Modal');
      window.location.href = upgradeLink;
      onOpenChange(false);
    } catch (error) {
      console.error('Error handling upgrade:', error);
      setError('Unable to process upgrade. Please try again later.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Upgrade to get more content credits and features
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <p>
            Your current plan: <span className="font-semibold">{plan || 'Free'}</span>
          </p>
          
          <div className="text-sm text-gray-500">
            Next tier available:
            {plan === 'starter' && (
              <span className="block">Growth Plan - 50 pieces of content per month</span>
            )}
            {plan === 'growth' && (
              <span className="block">Scale Plan - 150 pieces of content per month</span>
            )}
            {plan === 'scale' && (
              <span className="block">You&apos;re on our highest tier. Contact support for custom limits.</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {plan !== 'scale' && (
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? 'Loading...' : 'Upgrade Now'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
