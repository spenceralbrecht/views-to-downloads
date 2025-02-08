'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Camera, Sparkles, Loader2 } from 'lucide-react'

interface Price {
  id: string
  name: string
  price: string
  interval: string
  features: string[]
  popular: boolean
  checkoutUrl: string
}

export default function Pricing() {
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch('/api/stripe/prices')
        const data = await response.json()
        if (data.prices) {
          // Sort prices by amount to ensure consistent order
          const sortedPrices = data.prices.sort((a: Price, b: Price) => 
            parseInt(a.price) - parseInt(b.price)
          )
          setPrices(sortedPrices)
        }
      } catch (error) {
        console.error('Error fetching prices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
  }, [])

  const handleBuyNow = (checkoutUrl: string) => {
    window.location.href = checkoutUrl
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <section id="pricing" className="max-w-5xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Choose your plan</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {prices.map((plan) => (
          <div key={plan.id} className="relative">
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#4287f5] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            <Card className={`h-full ${plan.popular ? 'border-[#4287f5] border-2' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl text-center">{plan.name}</CardTitle>
                <div className="text-center">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-px bg-gray-200 my-4" />
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.includes('video') && <Video className="h-5 w-5 text-gray-900" />}
                    {feature.includes('UGC') && <Camera className="h-5 w-5 text-gray-900" />}
                    {feature.includes('hook') && <Sparkles className="h-5 w-5 text-gray-900" />}
                    <span className="text-gray-900">{feature}</span>
                  </div>
                ))}
                <Button 
                  onClick={() => handleBuyNow(plan.checkoutUrl)}
                  className={`w-full mt-6 ${
                    plan.popular 
                      ? 'bg-[#4287f5] hover:bg-[#3276e4] text-white' 
                      : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  )
}
