'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useSubscription, CONTENT_LIMITS } from '@/hooks/useSubscription'
import { useUser } from '@supabase/auth-helpers-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { getStripeConfig } from '@/config/stripe'
import { trackStripeCheckout } from '@/utils/tracking'

interface ContentLimitGuardProps {
  children: ReactNode
}

export function ContentLimitGuard({ children }: ContentLimitGuardProps) {
  const user = useUser()
  const { subscription, loading } = useSubscription(user)
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const plan = subscription?.plan_name || 'starter'
  const contentUsed = subscription?.content_used_this_month || 0
  const contentLimit = subscription ? CONTENT_LIMITS[subscription.plan_name] : CONTENT_LIMITS['starter']
  const hasRemainingContent = contentUsed < contentLimit

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDialog(true)
  }

  const handleUpgrade = () => {
    try {
      setError(null)
      const stripeConfig = getStripeConfig(user?.email)
      if (!stripeConfig.customerBillingLink) {
        throw new Error('Billing link not available')
      }
      trackStripeCheckout(user?.email);
      window.location.href = stripeConfig.customerBillingLink
    } catch (error) {
      console.error('Error handling upgrade:', error)
      setError('Unable to process upgrade. Please try again later.')
    }
  }

  if (hasRemainingContent) {
    return <>{children}</>
  }

  // Show limit reached dialog for subscribed users with no remaining content
  return (
    <>
      <div 
        className="relative cursor-not-allowed"
        onClick={handleClick}
      >
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
      </div>

      <Dialog 
        open={showDialog} 
        onOpenChange={setShowDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monthly Limit Reached</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                You&apos;ve used all your content credits for this month on your {plan} plan.
                Upgrade your plan to create more content or wait until your credits reset.
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
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
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
                {loading ? 'Loading...' : 'Upgrade Plan'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
