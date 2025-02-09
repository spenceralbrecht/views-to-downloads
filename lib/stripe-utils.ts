import { SupabaseClient } from '@supabase/supabase-js'

export interface StripeMetadata {
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  stripe_subscription_status?: string
  stripe_plan_name?: 'starter' | 'growth' | 'scale' | null
}

/**
 * Updates the Supabase user's metadata with Stripe-related information
 * Preserves existing non-Stripe metadata fields
 * @param supabase - Supabase client instance
 * @param userId - User ID to update
 * @param metadata - Stripe metadata to store
 */
export async function updateUserStripeMetadata(
  supabase: SupabaseClient,
  userId: string,
  metadata: StripeMetadata
): Promise<void> {
  try {
    // Get existing user metadata
    const { data: user, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    if (getUserError) throw getUserError

    // Merge new metadata with existing metadata
    // Remove any existing stripe fields and add new ones
    const existingMetadata = user.user.user_metadata || {}
    const cleanedMetadata = Object.entries(existingMetadata).reduce((acc, [key, value]) => {
      if (!key.startsWith('stripe_')) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)

    const updatedMetadata = {
      ...cleanedMetadata,
      ...metadata
    }

    // Update user with merged metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    })

    if (updateError) {
      throw updateError
    }
  } catch (error) {
    console.error('Error updating user stripe metadata:', error)
    throw error
  }
}
