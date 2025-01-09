'use client'
import Link from 'next/link'
import { useUser } from '@supabase/auth-helpers-react'

export default function StartNowButton() {
  const user = useUser()
  
  // If the user is logged in, link to dashboard
  if (user) {
    return (
      <Link href="/dashboard">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
          Dashboard →
        </button>
      </Link>
    )
  }

  // Otherwise, link to login (or show a login modal)
  return (
    <Link href="/login">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
        Start Now →
      </button>
    </Link>
  )
}

