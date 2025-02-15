'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Camera, Sparkles } from 'lucide-react'

const plans = [
  {
    name: "Starter",
    price: "19",
    description: "Perfect for getting started",
    popular: false,
    features: [
      { text: "10 videos per month", icon: Video },
      { text: "Limited UGC avatars", icon: Camera },
      { text: "Generate unlimited viral hooks", icon: Sparkles }
    ]
  },
  {
    name: "Growth",
    price: "49",
    description: "Perfect for growing creators",
    popular: true,
    features: [
      { text: "50 videos per month", icon: Video },
      { text: "All 50+ UGC avatars", icon: Camera },
      { text: "Generate unlimited viral hooks", icon: Sparkles }
    ]
  },
  {
    name: "Scale",
    price: "95",
    description: "For professional creators",
    popular: false,
    features: [
      { text: "150 videos per month", icon: Video },
      { text: "All 50+ UGC avatars", icon: Camera },
      { text: "Generate unlimited viral hooks", icon: Sparkles }
    ]
  }
]

export default function Pricing() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  return (
    <section id="pricing" className="max-w-5xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Choose your plan</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="relative">
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            <Card className={`h-full transition-all duration-200 hover:shadow-xl ${
              plan.popular 
                ? 'border-primary shadow-lg dark:bg-gray-900/60' 
                : 'dark:bg-gray-900/40 hover:border-primary/50'
            }`}>
              <CardHeader>
                <CardTitle className="text-2xl text-center mb-4">{plan.name}</CardTitle>
                <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-center text-muted-foreground text-sm">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-px bg-border my-4" />
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                    <span className="text-foreground">{feature.text}</span>
                  </div>
                ))}
                <Button 
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full mt-6 ${
                    plan.popular 
                      ? 'shadow-lg' 
                      : 'hover:bg-primary/10'
                  }`}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  )
}
