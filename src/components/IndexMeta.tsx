import { Helmet } from "react-helmet";

export const IndexMeta = () => {
  const canonicalUrl = "https://getthegift.ai";
  const title = "Get The Gift - AI-Powered Gift Suggestions | Find Perfect Gifts";
  const description = "Discover perfect gift ideas with our AI-powered gift suggestion engine. Get personalized recommendations for any occasion, budget, and recipient. Find unique and thoughtful presents easily.";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Primary keywords */}
      <meta name="keywords" content="gift suggestions, gift ideas, AI gift finder, perfect gifts, gift recommendations, personalized gifts, unique gifts, thoughtful presents" />
      
      {/* Open Graph tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${canonicalUrl}/og-image.png`} />
      <meta property="og:site_name" content="Get The Gift" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${canonicalUrl}/og-image.png`} />
      
      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Get The Gift Team" />
      
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
          "description": description,
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