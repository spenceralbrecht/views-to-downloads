'use client'

import { ReactNode, useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { useUser } from '@supabase/auth-helpers-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { stripeConfig } from '@/config/stripe'

interface ContentLimitGuardProps {
  children: ReactNode
}

export function ContentLimitGuard({ children }: ContentLimitGuardProps) {
  const user = useUser()
  const { contentRemaining, plan, isSubscribed } = useSubscription(user)
  const [showDialog, setShowDialog] = useState(false)

  // Only check limits for subscribed users
  // Unsubscribed users will be blocked by SubscriptionGuard
  if (!isSubscribed || contentRemaining > 0) {
    return <>{children}</>
  }

  // Show limit reached dialog for subscribed users with no remaining content
  return (
    <>
      <div onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowDialog(true)
      }}>
        {children}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            {plan !== 'scale' && (
              <Button onClick={() => window.location.href = stripeConfig.customerBillingLink}>
                Upgrade Plan
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
