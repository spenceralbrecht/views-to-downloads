import type { Metadata } from 'next'
import { Analytics } from "@vercel/analytics/react"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Script from 'next/script'
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Views to Downloads',
  description: 'Automating UGC content that gets you views and downloads',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <head>
        <script defer src="https://feedback.fish/ff.js?pid=8ce000788096e9"></script>
        {/* <Script id="microsoft-clarity" strategy="beforeInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "pqvyzv5zkm");
          `}
        </Script> */}
      </head>
      <body>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}



import './globals.css'