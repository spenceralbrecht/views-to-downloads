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
  plan_name: 'starter' | 'growth' | 'scale' | null
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
          console.error('Error fetching subscription:', error)
          setSubscription(null)
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
            setSubscription(null)
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

  const contentRemaining = subscription?.plan_name 
    ? CONTENT_LIMITS[subscription.plan_name] - (subscription.content_used_this_month || 0)
    : 0 // No content allowed without subscription

  console.log('Content remaining calculation:', {
    planName: subscription?.plan_name,
    planLimit: subscription?.plan_name ? CONTENT_LIMITS[subscription.plan_name] : 0,
    usedThisMonth: subscription?.content_used_this_month || 0,
    remaining: contentRemaining
  })

  return {
    subscription,
    loading,
    isSubscribed: subscription !== null,
    plan: subscription?.plan_name || null,
    contentUsed: subscription?.content_used_this_month || 0,
    contentRemaining,
    contentLimit: subscription?.plan_name ? CONTENT_LIMITS[subscription.plan_name] : 0
  }
}
