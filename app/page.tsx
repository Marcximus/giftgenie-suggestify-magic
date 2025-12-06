import { Suspense } from 'react';
import { HomeClient } from '@/components/HomeClient';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { SuggestionSkeleton } from '@/components/SuggestionSkeleton';
import type { Metadata } from 'next';
import Script from 'next/script';

// ISR with 60-second revalidation for fresh content
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Get The Gift - AI-Powered Gift Finder | Personalized Gift Ideas',
  description: 'Discover the perfect gift with AI-powered recommendations. Get personalized gift ideas for birthdays, holidays, and special occasions. Find unique presents from top retailers instantly.',
  keywords: [
    'gift finder',
    'gift ideas',
    'AI gift recommendations',
    'personalized gifts',
    'birthday gift ideas',
    'holiday gifts',
    'present finder',
    'unique gifts',
    'gift suggestions',
    'best gifts',
  ],
  openGraph: {
    title: 'Get The Gift - AI-Powered Gift Finder | Find Perfect Presents',
    description: 'Discover the perfect gift with AI-powered recommendations. Get personalized gift ideas for birthdays, holidays, and special occasions.',
    url: 'https://getthegift.ai',
    type: 'website',
    images: [{
      url: '/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png',
      width: 1200,
      height: 630,
      alt: 'Get The Gift - AI-Powered Gift Finder',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get The Gift - AI-Powered Gift Finder',
    description: 'Discover the perfect gift with AI-powered recommendations for any occasion.',
    images: ['/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png'],
  },
  alternates: {
    canonical: 'https://getthegift.ai',
  },
};

export default function Home() {
  const canonicalUrl = "https://getthegift.ai";
  const description = "Discover personalized, unique gift ideas with our AI-powered gift finder. Find the best presents for birthdays, holidays, and special occasions from top retailers.";

  return (
    <>
      {/* Structured Data - WebApplication */}
      <Script
        id="webapp-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Get The Gift",
            "description": description,
            "url": canonicalUrl,
            "applicationCategory": "Shopping",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered gift suggestions",
              "Personalized recommendations",
              "Budget-friendly options",
              "Real product reviews",
              "Smart filtering",
              "Instant gift ideas"
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "1250"
            }
          })
        }}
      />

      {/* Structured Data - Organization */}
      <Script
        id="org-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Get The Gift",
            "url": canonicalUrl,
            "logo": "https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png",
            "description": description,
            "foundingDate": "2024",
            "applicationCategory": "AI-Powered Gift Finder"
          })
        }}
      />

      {/* Structured Data - BreadcrumbList */}
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": canonicalUrl
            }]
          })
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
        <div className="container mx-auto px-2 pt-2 sm:pt-6 pb-4 sm:pb-8 max-w-7xl">
          <BreadcrumbNav />

          <Suspense
            fallback={
              <div className="space-y-6">
                <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg" />
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <SuggestionSkeleton key={i} />
                  ))}
                </div>
              </div>
            }
          >
            <HomeClient />
          </Suspense>
        </div>
      </main>
    </>
  );
}
