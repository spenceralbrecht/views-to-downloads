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
    <html lang="en" className="dark">
      <head>
        <script defer src="https://feedback.fish/ff.js?pid=8ce000788096e9"></script>
        <Script id="new-relic" strategy="beforeInteractive">
          {`
            ;window.NREUM||(NREUM={});NREUM.init={distributed_tracing:{enabled:true},privacy:{cookies_enabled:true},ajax:{deny_list:["bam.nr-data.net"]}};
            
            ;NREUM.loader_config={accountID:"6454671",trustKey:"6454671",agentID:"1134555137",licenseKey:"NRJS-89b34598ab2aebca1b4",applicationID:"1134555137"};
            ;NREUM.info={beacon:"bam.nr-data.net",errorBeacon:"bam.nr-data.net",licenseKey:"NRJS-89b34598ab2aebca1b4",applicationID:"1134555137",sa:1};
          `}
        </Script>
        <Script 
          src="https://js-agent.newrelic.com/nr-loader-spa-1.281.0.min.js"
          strategy="beforeInteractive"
        />
        <Script id="microsoft-clarity" strategy="beforeInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "pqvyzv5zkm");
          `}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-16874049011"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-16874049011');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

import './globals.css'