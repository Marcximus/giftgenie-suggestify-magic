import Script from "next/script";

export const IndexMeta = () => {
  const canonicalUrl = "https://getthegift.ai";
  const description = "Discover personalized, unique gift ideas with our AI-powered gift finder. Find the best presents for birthdays, holidays, and special occasions from top retailers.";

  return (
    <>
      {/* Structured Data - WebApplication */}
      <Script
        id="webapp-schema"
        type="application/ld+json"
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
              "Smart filtering"
            ]
          })
        }}
      />

      {/* Structured Data - Organization */}
      <Script
        id="org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Get The Gift",
            "url": canonicalUrl,
            "logo": "https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png",
            "description": description,
            "foundingDate": "2024",
            "applicationCategory": "AI-Powered Gift Finder",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "1250"
            }
          })
        }}
      />
    </>
  );
};
