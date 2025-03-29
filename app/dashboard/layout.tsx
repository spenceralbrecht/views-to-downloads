export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from "@/components/dashboard/Sidebar"
import CheckoutSuccessWrapper from '@/components/dashboard/CheckoutSuccessWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={session.user} />
      <main className="pt-4 lg:pl-64">
        <CheckoutSuccessWrapper>
          {children}
        </CheckoutSuccessWrapper>
      </main>
    </div>
  )
}
