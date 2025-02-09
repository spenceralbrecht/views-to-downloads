import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { updateUserStripeMetadata } from '../../lib/stripe-utils'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') })

// Use existing environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

describe('Stripe Metadata Management', () => {
  const TEST_USER_ID = 'e3d6c0cc-e5c2-4589-a280-fcf35f602918'
  let supabase: SupabaseClient
  let originalMetadata: any

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Store original metadata
    const { data: user, error } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (error) throw error
    originalMetadata = user.user.user_metadata
  })

  beforeEach(async () => {
    // Reset user metadata to original state before each test
    const { error } = await supabase.auth.admin.updateUserById(TEST_USER_ID, {
      user_metadata: originalMetadata
    })
    if (error) throw error
  })

  afterAll(async () => {
    // Restore original metadata
    await supabase.auth.admin.updateUserById(TEST_USER_ID, {
      user_metadata: originalMetadata
    })
  })

  it('should update user metadata with stripe customer id', async () => {
    const stripeCustomerId = 'cus_test123'
    const mockMetadata = {
      stripe_customer_id: stripeCustomerId
    }

    await updateUserStripeMetadata(supabase, TEST_USER_ID, mockMetadata)

    // Verify the metadata was updated
    const { data: user, error } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (error) throw error

    expect(user.user.user_metadata.stripe_customer_id).toBe(stripeCustomerId)
    // Verify other metadata fields were preserved
    Object.entries(originalMetadata).forEach(([key, value]) => {
      if (!key.startsWith('stripe_')) {
        expect(user.user.user_metadata[key]).toBe(value)
      }
    })
  })

  it('should update user metadata with subscription info', async () => {
    const mockMetadata = {
      stripe_customer_id: 'cus_test123',
      stripe_subscription_id: 'sub_test123',
      stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID,
      stripe_subscription_status: 'active',
      stripe_plan_name: 'starter'
    }

    await updateUserStripeMetadata(supabase, TEST_USER_ID, mockMetadata)

    // Verify the metadata was updated
    const { data: user, error } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (error) throw error

    // Verify Stripe metadata was updated
    Object.entries(mockMetadata).forEach(([key, value]) => {
      expect(user.user.user_metadata[key]).toBe(value)
    })

    // Verify other metadata fields were preserved
    Object.entries(originalMetadata).forEach(([key, value]) => {
      if (!key.startsWith('stripe_')) {
        expect(user.user.user_metadata[key]).toBe(value)
      }
    })
  })

  it('should update user metadata for growth plan subscription', async () => {
    const mockMetadata = {
      stripe_customer_id: 'cus_test456',
      stripe_subscription_id: 'sub_test456',
      stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID,
      stripe_subscription_status: 'active',
      stripe_plan_name: 'growth'
    }

    await updateUserStripeMetadata(supabase, TEST_USER_ID, mockMetadata)

    const { data: user, error } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (error) throw error

    expect(user.user.user_metadata.stripe_plan_name).toBe('growth')
    expect(user.user.user_metadata.stripe_subscription_status).toBe('active')
  })

  it('should update user metadata for scale plan subscription', async () => {
    const mockMetadata = {
      stripe_customer_id: 'cus_test789',
      stripe_subscription_id: 'sub_test789',
      stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID,
      stripe_subscription_status: 'active',
      stripe_plan_name: 'scale'
    }

    await updateUserStripeMetadata(supabase, TEST_USER_ID, mockMetadata)

    const { data: user, error } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (error) throw error

    expect(user.user.user_metadata.stripe_plan_name).toBe('scale')
    expect(user.user.user_metadata.stripe_subscription_status).toBe('active')
  })

  it('should handle subscription cancellation', async () => {
    const mockMetadata = {
      stripe_customer_id: 'cus_test123',
      stripe_subscription_id: null,
      stripe_price_id: null,
      stripe_subscription_status: 'canceled',
      stripe_plan_name: null
    }

    await updateUserStripeMetadata(supabase, TEST_USER_ID, mockMetadata)

    const { data: user, error } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (error) throw error

    expect(user.user.user_metadata.stripe_subscription_status).toBe('canceled')
    expect(user.user.user_metadata.stripe_plan_name).toBeFalsy()
    expect(user.user.user_metadata.stripe_price_id).toBeFalsy()
  })

  it('should handle subscription past due status', async () => {
    const mockMetadata = {
      stripe_customer_id: 'cus_test123',
      stripe_subscription_id: 'sub_test123',
      stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID,
      stripe_subscription_status: 'past_due',
      stripe_plan_name: 'starter'
    }

    await updateUserStripeMetadata(supabase, TEST_USER_ID, mockMetadata)

    const { data: user, error } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (error) throw error

    expect(user.user.user_metadata.stripe_subscription_status).toBe('past_due')
    expect(user.user.user_metadata.stripe_plan_name).toBe('starter')
  })

  it('should handle errors when updating user metadata', async () => {
    const invalidUserId = '00000000-0000-0000-0000-000000000000' // Valid UUID format but doesn't exist
    
    await expect(
      updateUserStripeMetadata(supabase, invalidUserId, { stripe_customer_id: 'cus_test123' })
    ).rejects.toThrow()
  })
})
