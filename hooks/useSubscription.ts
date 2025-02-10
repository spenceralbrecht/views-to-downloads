'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

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

  return {
    subscription,
    loading,
    isSubscribed: subscription !== null,
    plan: subscription?.plan_name || null
  }
}
