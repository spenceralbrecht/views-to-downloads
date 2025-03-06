import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

export const metadata: Metadata = {
  title: 'Views to Downloads',
  description: 'Turn your TikTok views into app downloads',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-XXXXXXX');
            `
          }}
        />
        {/* Twitter conversion tracking base code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
              },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
              a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
              twq('config','oyx5r');
            `
          }}
        />
        {/* End Twitter conversion tracking base code */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Transfer TikTok code verifier from localStorage to cookie when callback is detected
            (function() {
              console.log('Checking for TikTok callback path:', window.location.pathname);
              if (window.location.pathname === '/api/auth/tiktok/callback') {
                console.log('TikTok callback detected');
                const codeVerifier = localStorage.getItem('tiktok_code_verifier');
                console.log('Code verifier from localStorage:', codeVerifier ? 'present' : 'missing');
                if (codeVerifier) {
                  document.cookie = 'tiktok_code_verifier=' + codeVerifier + '; path=/; max-age=300; SameSite=Lax';
                  console.log('Code verifier cookie set');
                } else {
                  console.error('No code verifier found in localStorage');
                }
              }
            })();
          `
        }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
        <Analytics />
        <Script
          src={`https://feedback.fish/ff.js?pid=8ce000788096e9`}
          defer
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}