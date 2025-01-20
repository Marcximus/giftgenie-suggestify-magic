import { Helmet } from "react-helmet";

export const IndexMeta = () => {
  const canonicalUrl = "https://getthegift.ai";

  return (
    <Helmet>
      <title>Get The Gift - AI-Powered Gift Suggestions | Find Perfect Gifts</title>
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://www.amazon.com" />
      <link rel="preconnect" href="https://m.media-amazon.com" />
      <link rel="preconnect" href="https://images-na.ssl-images-amazon.com" />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Get The Gift",
          "url": canonicalUrl,
          "applicationCategory": "Shopping",
          "description": "AI-powered gift suggestion engine that helps users find perfect presents for any occasion",
          "browserRequirements": "Requires JavaScript. Requires HTML5.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        })}
      </script>
    </Helmet>
  );
};