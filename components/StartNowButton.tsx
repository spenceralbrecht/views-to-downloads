'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'

export default function StartNowButton() {
  const user = useUser()
  const supabase = createClientComponentClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

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
    <button 
      onClick={handleSignIn}
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
    >
      Start Now →
    </button>
  )
}

