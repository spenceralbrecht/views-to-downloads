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
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  getLink: () => string | undefined
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Perfect for getting started with video creation',
    features: [
      'Create up to 10 videos per month',
      'Basic video editing features',
      'Standard quality exports',
      'Email support'
    ],
    getLink: () => getStripeConfig().checkoutLinks.starter
  },
  {
    name: 'Growth',
    description: 'Ideal for growing creators',
    features: [
      'Create up to 50 videos per month',
      'Advanced video editing features',
      'HD quality exports',
      'Priority email support',
      'Custom branding'
    ],
    getLink: () => getStripeConfig().checkoutLinks.growth
  },
  {
    name: 'Scale',
    description: 'For professional content creators',
    features: [
      'Unlimited video creation',
      'Premium video editing features',
      '4K quality exports',
      '24/7 priority support',
      'Custom branding',
      'API access',
      'Team collaboration'
    ],
    getLink: () => getStripeConfig().checkoutLinks.scale
  }
]

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch('/api/stripe/prices')
        const data = await response.json()
        if (data.prices) {
          setPrices(data.prices)
        }
      } catch (error) {
        console.error('Error fetching prices:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchPrices()
    }
  }, [isOpen])

  const handlePurchaseClick = (tier: PricingTier) => {
    const link = tier.getLink()
    if (!link) {
      console.error(`Checkout link not found for ${tier.name} plan`)
      return
    }
    window.location.href = link
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
