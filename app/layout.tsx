import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { FloatingNav } from '@/components/FloatingNav'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'GiftGenie - AI-Powered Gift Recommendations',
  description: 'Find the perfect gift with AI-powered recommendations',
  icons: {
    icon: '/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DB54W7MG31"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DB54W7MG31', {
              send_page_view: false
            });
          `}
        </Script>

        {/* Ahrefs Analytics */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="DDkos4H1nO2jHXmBz7pwRg"
          strategy="afterInteractive"
        />

        {/* Rybbit */}
        <Script
          src="https://app.rybbit.io/api/script.js"
          data-site-id="4f3d1db10112"
          strategy="afterInteractive"
        />

        {/* DNS Prefetch */}
        <link rel="preconnect" href="https://www.amazon.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.amazon.com" />
        <link rel="preconnect" href="https://m.media-amazon.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="preconnect" href="https://images-na.ssl-images-amazon.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images-na.ssl-images-amazon.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://ckcqttsdpxfbpkzljctl.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ckcqttsdpxfbpkzljctl.supabase.co" />
      </head>
      <body>
        <Providers>
          {children}
          <FloatingNav />
          <Toaster />
        </Providers>
        <Script
          src="https://cdn.gpteng.co/gptengineer.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
