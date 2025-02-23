import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CONTENT_LIMITS } from '@/hooks/useSubscription'

export async function incrementContentUsage(userId: string) {
  const supabase = createClientComponentClient()
  
  console.log('Incrementing content usage for user:', userId)
  
  // Get current subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (subError || !subscription) {
    console.error('Error fetching subscription:', {
      error: subError,
      userId: userId
    })
    return false
  }

  console.log('Found subscription:', {
    id: subscription.id,
    userId: subscription.user_id,
    currentUsage: subscription.content_used_this_month
  })

  // Check if user has reached their limit
  const limit = CONTENT_LIMITS[subscription.plan_name as keyof typeof CONTENT_LIMITS] || 0
  if (subscription.content_used_this_month >= limit) {
    console.log('User has reached content limit:', {
      currentUsage: subscription.content_used_this_month,
      limit: limit
    })
    return false
  }

  // Increment usage - ensure we're using the correct types
  const newUsageCount = (subscription.content_used_this_month || 0) + 1
  console.log('Attempting to update usage count:', {
    subscriptionId: subscription.id,
    currentCount: subscription.content_used_this_month,
    newCount: newUsageCount
  })

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ 
      content_used_this_month: newUsageCount 
    })
    .eq('id', subscription.id)
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error updating content usage:', {
      error: updateError,
      subscriptionId: subscription.id,
      userId: userId,
      attemptedUpdate: newUsageCount
    })
    return false
  }

  console.log('Successfully updated content usage:', {
    subscriptionId: subscription.id,
    newCount: newUsageCount
  })

  return true
}

export function getContentLimitForPlan(plan: keyof typeof CONTENT_LIMITS | null) {
  if (!plan) return 0
  return CONTENT_LIMITS[plan]
}
