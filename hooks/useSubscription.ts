'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

export const CONTENT_LIMITS = {
  free: 5,
  starter: 10,
  growth: 50,
  scale: 150
} as const

export type Subscription = {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_name: 'free' | 'starter' | 'growth' | 'scale'
  status: string
  current_period_start: string
  current_period_end: string
  content_used_this_month: number
  content_reset_date: string
}

export function useSubscription(user: User | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    async function getSubscription() {
      try {
        console.log('Fetching subscription for user:', user.id)
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // No subscription found, set to free tier
            console.log('No active subscription found, using free tier')
            setSubscription({
              id: '',
              user_id: user.id,
              stripe_customer_id: '',
              stripe_subscription_id: '',
              stripe_price_id: '',
              plan_name: 'free',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date().toISOString(),
              content_used_this_month: 0,
              content_reset_date: new Date().toISOString()
            })
          } else {
            console.error('Error fetching subscription:', error)
            setSubscription(null)
          }
        } else {
          console.log('Subscription data:', data)
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error in subscription fetch:', error)
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    getSubscription()

    // Subscribe to changes
    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Subscription change:', payload)
          if (payload.eventType === 'DELETE') {
            // Reset to free tier on deletion
            setSubscription({
              id: '',
              user_id: user.id,
              stripe_customer_id: '',
              stripe_subscription_id: '',
              stripe_price_id: '',
              plan_name: 'free',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date().toISOString(),
              content_used_this_month: 0,
              content_reset_date: new Date().toISOString()
            })
          } else {
            setSubscription(payload.new as Subscription)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Get the current plan name, defaulting to 'free' if no subscription
  const plan = subscription?.plan_name || 'free'
  
  // Calculate content limits
  const contentLimit = CONTENT_LIMITS[plan]
  const contentUsed = subscription?.content_used_this_month || 0
  const contentRemaining = Math.max(0, contentLimit - contentUsed)

  // Check if user has an active paid subscription
  const isSubscribed = subscription?.plan_name !== 'free' && subscription?.status === 'active'

  return {
    subscription,
    isSubscribed,
    plan,
    contentUsed,
    contentRemaining,
    contentLimit,
    loading
  }
}
