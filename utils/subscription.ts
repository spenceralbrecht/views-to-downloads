import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CONTENT_LIMITS } from '@/hooks/useSubscription'

export async function incrementContentUsage(userId: string) {
  const supabase = createClientComponentClient()
  
  // Get current subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (subError || !subscription) {
    console.error('Error fetching subscription:', subError)
    return false
  }

  // Check if user has reached their limit
  const limit = CONTENT_LIMITS[subscription.plan_name as keyof typeof CONTENT_LIMITS] || 0
  if (subscription.content_used_this_month >= limit) {
    return false
  }

  // Increment usage
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ content_used_this_month: subscription.content_used_this_month + 1 })
    .eq('id', subscription.id)

  if (updateError) {
    console.error('Error updating content usage:', updateError)
    return false
  }

  return true
}

export function getContentLimitForPlan(plan: keyof typeof CONTENT_LIMITS | null) {
  if (!plan) return 0
  return CONTENT_LIMITS[plan]
}
