'use client'
import { useUser } from '@supabase/auth-helpers-react'

export default function StartNowButton() {
  const user = useUser()

  if (user) {
    // If logged in, link directly to dashboard
    return (
      <a href="/dashboard">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
          Dashboard →
        </button>
      </a>
    )
  }

  // If not logged in, point to the sign-in endpoint
  return (
    <a href="/api/auth/signin">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
        Start Now →
      </button>
    </a>
  )
}

