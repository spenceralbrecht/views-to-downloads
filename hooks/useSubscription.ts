'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

export const CONTENT_LIMITS = {
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
  plan_name: 'starter' | 'growth' | 'scale'
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
        console.log('Fetching subscription for user:', user!.id)
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user!.id)
          .eq('status', 'active')
          .maybeSingle()

        if (error) {
          console.error('Error fetching subscription:', error)
          setSubscription(null)
        } else if (data) {
          console.log('Subscription data:', data);
          const sub = { ...data, plan_name: data.plan_name || 'starter' };
          setSubscription(sub);
        } else {
          console.log('No active subscription found for user');
          setSubscription(null);
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
          filter: `user_id=eq.${user!.id}`
        },
        (payload) => {
          console.log('Subscription change:', payload)
          if (payload.eventType === 'DELETE') {
            // Reset to free tier on deletion
            setSubscription({
              id: '',
              user_id: user!.id,
              stripe_customer_id: '',
              stripe_subscription_id: '',
              stripe_price_id: '',
              plan_name: 'starter',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date().toISOString(),
              content_used_this_month: 0,
              content_reset_date: new Date().toISOString()
            })
          } else if (payload.new && payload.new.plan_name) {
            setSubscription(payload.new as Subscription)
          } else {
            console.warn('Received subscription update with invalid data:', payload)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Get the current plan name; if no subscription, then user is not subscribed
  const plan = subscription ? subscription.plan_name : null;

  // Calculate content limits only if a valid plan exists
  const contentUsed = subscription ? subscription.content_used_this_month : 0;
  const contentLimit = plan ? CONTENT_LIMITS[plan] : 0;
  const contentRemaining = plan ? Math.max(0, contentLimit - contentUsed) : 0;

  // Check if user has an active paid subscription (no free plan available)
  const isSubscribed = subscription ? subscription.status === 'active' : false;

  const monthlyLimit = 100;
  const contentRemainingMonthly = subscription ? monthlyLimit - subscription.content_used_this_month : 0;

  return {
    subscription,
    loading,
    isSubscribed: subscription ? subscription.status === 'active' : false,
    plan,
    contentUsed,
    contentLimit,
    contentRemaining
  }
}
