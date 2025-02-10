'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useSubscription } from '@/hooks/useSubscription'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { stripeConfig } from '@/config/stripe'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredPlan?: 'starter' | 'growth' | 'scale'
  fallback?: React.ReactNode
}

export function SubscriptionGuard({ 
  children, 
  requiredPlan = 'starter',
  fallback 
}: SubscriptionGuardProps) {
  const user = useUser()
  const { subscription, isSubscribed, plan, loading } = useSubscription(user)

  if (loading) {
    return null // or a loading spinner
  }

  // Not subscribed
  if (!isSubscribed) {
    return fallback || (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
        <p className="text-sm text-gray-600 mb-4">
          Subscribe to access this feature and more.
        </p>
        <Button asChild>
          <a 
            href={stripeConfig.checkoutLinks.starter} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Subscribe Now
          </a>
        </Button>
      </Card>
    )
  }

  // Check plan level
  const planLevels = {
    starter: 1,
    growth: 2,
    scale: 3
  }

  const userPlanLevel = planLevels[plan || 'starter']
  const requiredPlanLevel = planLevels[requiredPlan]

  if (userPlanLevel < requiredPlanLevel) {
    return fallback || (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Plan Upgrade Required</h3>
        <p className="text-sm text-gray-600 mb-4">
          This feature requires the {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan or higher.
        </p>
        <Button asChild>
          <a 
            href={stripeConfig.customerBillingLink} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Upgrade Plan
          </a>
        </Button>
      </Card>
    )
  }

  return children
}
