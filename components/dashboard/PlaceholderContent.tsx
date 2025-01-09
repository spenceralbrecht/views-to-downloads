'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinWaitlist } from '@/app/dashboard/actions'

export function PlaceholderContent() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const result = await joinWaitlist(email)
      if (result.success) {
        setIsSubmitted(true)
      } else {
        setError(result.error || 'Failed to join waitlist')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error in handleSubmit:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
      <p className="text-lg mb-4">
        We are actively developing this product and it should be out of beta soon.
      </p>
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <p className="mb-2">Get notified when we're out of beta:</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
      ) : (
        <p className="text-green-600 font-semibold">
          Thank you for joining our waitlist! We'll notify you when we're out of beta.
        </p>
      )}
    </div>
  )
}

