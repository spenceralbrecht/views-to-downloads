import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PlaceholderContent } from "@/components/dashboard/PlaceholderContent"

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {session.user && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome, {session.user.email}!</h2>
          <p>User ID: {session.user.id}</p>
          <p>Last Sign In: {new Date(session.user.last_sign_in_at || '').toLocaleString()}</p>
        </div>
      )}
      <PlaceholderContent />
    </div>
  )
}

