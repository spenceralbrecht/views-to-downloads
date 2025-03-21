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
      <div className="lg:pl-64 min-h-screen pb-16 lg:pb-0">
        <CheckoutSuccessWrapper>
          {children}
        </CheckoutSuccessWrapper>
      </div>
    </div>
  )
}
