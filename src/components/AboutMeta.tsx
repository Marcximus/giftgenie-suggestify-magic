import { Helmet } from "react-helmet";

export const AboutMeta = () => {
  const canonicalUrl = "https://getthegift.ai/about";
  const title = "About Get The Gift - AI-Powered Gift Recommendations";
  const description = "Learn about Get The Gift, the AI-powered gift finder that helps you discover personalized, unique gift ideas for any occasion. Our mission is to make gift-giving effortless.";

  // FAQ data for structured data
  const faqData = [
    {
      question: "How does Get The Gift's AI work?",
      answer: "Our AI analyzes your gift requirements including recipient, occasion, interests, and budget to generate personalized gift suggestions from top retailers."
    },
    {
      question: "Is Get The Gift free to use?",
      answer: "Yes! Get The Gift is completely free to use. We earn a small commission when you purchase through our affiliate links, at no extra cost to you."
    },
    {
      question: "How accurate are the gift recommendations?",
      answer: "Our AI is trained on millions of gift-giving scenarios and continuously learns from user feedback to provide increasingly accurate and relevant suggestions."
    },
    {
      question: "Can I get gift ideas for any occasion?",
      answer: "Absolutely! Whether it's birthdays, holidays, anniversaries, or any special moment, our AI can help you find the perfect gift."
    },
    {
      question: "Where do the products come from?",
      answer: "We search across major retailers like Amazon to find real products with genuine reviews, ensuring you get quality gift recommendations."
    }
  ];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Keywords */}
      <meta name="keywords" content="about get the gift, AI gift finder, gift recommendation service, personalized gift ideas, how it works" />
      <meta name="author" content="Get The Gift" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content="https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png" />
      <meta property="og:site_name" content="Get The Gift" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png" />
      
      {/* Robots */}
      <meta name="robots" content="index, follow" />
      
      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqData.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        })}
      </script>
      
      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "Organization",
            "name": "Get The Gift",
            "url": "https://getthegift.ai",
            "logo": "https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png",
            "description": description,
            "foundingDate": "2024"
          }
        })}
      </script>
      
      {/* Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://getthegift.ai"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "About",
              "item": canonicalUrl
            }
          ]
        })}
      </script>
    </Helmet>
  );
};
