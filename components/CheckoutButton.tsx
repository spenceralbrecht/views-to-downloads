'use client'

import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { useUser } from '@supabase/auth-helpers-react'

interface CheckoutButtonProps {
  priceId: string
  children: React.ReactNode
}

export function CheckoutButton({ priceId, children }: CheckoutButtonProps) {
  const router = useRouter()
  const user = useUser()

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Error:', data.error)
        return
      }

      // Redirect to Stripe Checkout
      router.push(data.url)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <Button onClick={handleCheckout}>
      {children}
    </Button>
  )
}
