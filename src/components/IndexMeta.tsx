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
          },
          "mainEntity": {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does Get The Gift work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Get The Gift uses advanced AI technology to analyze your requirements and suggest personalized gift ideas. Simply describe who you're buying for and their interests, and our AI will recommend perfect gifts within your budget."
                }
              },
              {
                "@type": "Question",
                "name": "Are the gift suggestions free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, using Get The Gift to find gift suggestions is completely free. We provide detailed recommendations including prices, reviews, and where to buy the gifts."
                }
              },
              {
                "@type": "Question",
                "name": "How accurate are the product prices and availability?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We fetch real-time prices and availability from Amazon and other retailers. However, prices and availability can change quickly, so we recommend checking the final price on the retailer's website."
                }
              }
            ]
          }
        })}
      </script>
    </Helmet>
  );
};