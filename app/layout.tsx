import type { Metadata } from 'next'
import { Analytics } from "@vercel/analytics/react"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Script from 'next/script'
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Views to Downloads',
    template: '%s | Views to Downloads'
  },
  description: 'Automating UGC content that gets you views and downloads',
  keywords: ['UGC', 'content creation', 'app marketing', 'video content', 'automation'],
  authors: [{ name: 'Views to Downloads' }],
  creator: 'Views to Downloads',
  publisher: 'Views to Downloads',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://viewstodownloads.com',
    title: 'Views to Downloads',
    description: 'Automating UGC content that gets you views and downloads',
    siteName: 'Views to Downloads',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Views to Downloads',
    description: 'Automating UGC content that gets you views and downloads',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
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
        <script
          defer
          data-website-id="67bba6ec4eab65b131b903fc"
          data-domain="viewstodownloads.com"
          src="https://datafa.st/js/script.js"
        />
        <script defer src="https://feedback.fish/ff.js?pid=8ce000788096e9"></script>
        <Script id="microsoft-clarity" strategy="beforeInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "pqvyzv5zkm");
          `}
        </Script>
        {/* Twitter conversion tracking base code */}
        <Script id="twitter-tracking" strategy="afterInteractive">
          {`
            !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
            },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
            a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
            twq('config','oyx5r');
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