import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createClient() {
  return createServerComponentClient(
    { cookies },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options: {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookies().set(name, value, options)
            } catch (error) {
              // Handle cookies.set error in middleware
            }
          },
          remove(name: string, options: any) {
            try {
              cookies().set(name, '', { ...options, maxAge: 0 })
            } catch (error) {
              // Handle cookies.remove error in middleware
            }
          },
        },
      },
    }
  )
} 