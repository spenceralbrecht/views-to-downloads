import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CONTENT_LIMITS } from '@/hooks/useSubscription'

export async function incrementContentUsage(userId: string) {
  const supabase = createClientComponentClient()
  
  // Get and validate subscription
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !subscription) return false

  // Check usage limit
  const limit = CONTENT_LIMITS[subscription.plan_name as keyof typeof CONTENT_LIMITS] || 0
  const currentUsage = subscription.content_used_this_month || 0
  if (currentUsage >= limit) return false

  // Increment usage
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ content_used_this_month: currentUsage + 1 })
    .eq('id', subscription.id)
    .eq('user_id', userId)

  return !updateError
}

export function getContentLimitForPlan(plan: keyof typeof CONTENT_LIMITS | null) {
  return plan ? CONTENT_LIMITS[plan] : 0
}
