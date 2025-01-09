import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PlaceholderContent } from "@/components/dashboard/PlaceholderContent"

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {user && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}!</h2>
          <p>User ID: {user.id}</p>
          <p>Last Sign In: {new Date(user.last_sign_in_at || '').toLocaleString()}</p>
        </div>
      )}
      <PlaceholderContent />
    </div>
  )
}

