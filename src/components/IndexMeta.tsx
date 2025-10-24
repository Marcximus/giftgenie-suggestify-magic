
import { Helmet } from "react-helmet";

export const IndexMeta = () => {
  const canonicalUrl = "https://getthegift.ai";
  const title = "Best Gift Ideas Powered by AI | Personalized & Unique Gifts for Every Occasion";
  const description = "Discover personalized, unique gift ideas with our AI-powered gift finder. Find the best presents for birthdays, holidays, and special occasions from top retailers.";

  return (
    <Helmet>
      {/* Clear any existing meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Primary keywords */}
      <meta name="keywords" content="gift suggestions, AI gift finder, personalized gifts, gift recommendations, gift ideas, Get The Gift" />
      <meta name="author" content="Get The Gift" />
      
      {/* Open Graph tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content="/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png" />
      <meta property="og:site_name" content="Get The Gift" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png" />
      <meta name="twitter:site" content="@getthegift" />
      
      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
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
        })}
      </script>
    </Helmet>
  );
};
