'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getStripeConfig } from '@/config/stripe'
import { trackStripeCheckout } from '@/utils/tracking'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Price {
  id: string
  name: string
  price: string
  interval: string
  features: string[]
  popular: boolean
  checkoutUrl: string
}

interface PricingTier {
  name: string
  description: string
  features: string[]
  getLink: (email?: string | null) => string | undefined
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Perfect for getting started with video creation',
    features: [
      'Create up to 10 videos per month',
      'Auto Generate Engaging Hooks',
    ],
    getLink: (email) => getStripeConfig(email).checkoutLinks.starter
  },
  {
    name: 'Growth',
    description: 'Ideal for growing creators',
    features: [
      'Create up to 50 videos per month',
      'Auto Generate Engaging Hooks',
      'Early access to new viral formats',
    ],
    getLink: (email) => getStripeConfig(email).checkoutLinks.growth
  },
  {
    name: 'Scale',
    description: 'For professional content creators',
    features: [
      'Create up to 100 videos per month',
      'Auto Generate Engaging Hooks',
      'Early access to new viral formats',
      'Priority support',
    ],
    getLink: (email) => getStripeConfig(email).checkoutLinks.scale
  }
]

function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient();
  const user = useUser();
  

  useEffect(() => {
    console.log('PricingModal useEffect, user from useUser hook:', user);
    
    async function fetchPrices() {
      try {
        setError(null)
        const response = await fetch('/api/stripe/prices')
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        if (data.prices) {
          setPrices(data.prices)
        }
      } catch (error) {
        console.error('Error fetching prices:', error)
        setError('Failed to load pricing information. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchPrices()
    }
  }, [isOpen])

  const handlePurchaseClick = async (tier: PricingTier) => {
    try {
      console.log('handlePurchaseClick called for tier:', tier.name);
      
      // Get user email AND ID directly from Supabase session for freshness
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error fetching Supabase session:', sessionError);
        setError('Could not verify user session. Please try logging in again.');
        return;
      }

      if (!session?.user) {
        console.error('No active Supabase session found.');
        setError('You need to be logged in to make a purchase.');
        // Potentially redirect to login or show login prompt
        return;
      }
      
      const userEmail = session.user.email; // Use email from the fresh session
      const userId = session.user.id; // Get user ID from the fresh session
      
      console.log('User details from session: Email:', userEmail, 'ID:', userId);
      
      if (!userEmail || !userId) {
         console.error('Missing email or ID in user session.');
         setError('Could not retrieve necessary user details. Please try again.');
         return;
      }
      
      // Pass BOTH email and userId to getStripeConfig
      const config = getStripeConfig(userEmail, userId);
      
      // Get the correct link from the generated config based on tier name
      let link: string | undefined;
      const tierKey = tier.name.toLowerCase() as keyof typeof config.checkoutLinks;
      if (config.checkoutLinks.hasOwnProperty(tierKey)) {
        link = config.checkoutLinks[tierKey];
        console.log(`Selected checkout link for ${tier.name} (${tierKey}):`, link);
      } else {
        console.error(`Could not find matching checkout link key for tier name: ${tier.name}`);
        setError(`Configuration error for ${tier.name} plan. Please contact support.`);
        return;
      }

      console.log('Generated link with params:', link);
      
      if (!link) {
        console.error(`Checkout link not found or failed to generate for ${tier.name} plan`);
        setError(`Unable to process ${tier.name} plan purchase. Please ensure configuration is correct.`)
        return
      }
      
      // Track the checkout with the tier name for better analytics
      trackStripeCheckout(userEmail, tier.name);
      
      // Open Stripe checkout in a new tab
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error handling purchase click:', error)
      setError('An unexpected error occurred while trying to process the purchase. Please try again later.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Select the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {pricingTiers.map((tier, index) => {
            const priceInfo = prices[index]
            return (
              <div
                key={tier.name}
                className="rounded-lg p-6 bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <h4 className="text-xl font-semibold mb-2 text-foreground">{tier.name}</h4>
                <div className="text-3xl font-bold mb-4 text-foreground">
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <>
                      ${priceInfo?.price}<span className="text-sm font-normal text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">{tier.description}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-muted-foreground">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full btn-gradient"
                  onClick={() => handlePurchaseClick(tier)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : `Start with ${tier.name}`}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PricingModal;
