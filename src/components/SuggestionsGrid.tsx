import { GiftSuggestion } from '@/types/suggestions';
import { SuggestionsGridItems } from './suggestions/SuggestionsGridItems';
import { SuggestionsActions } from './suggestions/SuggestionsActions';

interface SuggestionsGridProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  onGenerateMore: () => void;
  onStartOver: () => void;
  isLoading: boolean;
}

export const SuggestionsGrid = ({ 
  suggestions, 
  onMoreLikeThis, 
  onGenerateMore,
  onStartOver,
  isLoading 
}: SuggestionsGridProps) => {
  // Prepare schema.org structured data for the list of suggestions
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": suggestions.map((suggestion, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": suggestion.title,
        "description": suggestion.description,
        "image": suggestion.amazon_image_url,
        "offers": {
          "@type": "Offer",
          "price": suggestion.amazon_price || suggestion.priceRange?.replace(/[^0-9.]/g, ''),
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": suggestion.amazon_url
        },
        ...(suggestion.amazon_rating && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": suggestion.amazon_rating,
            "reviewCount": suggestion.amazon_total_ratings || 0,
            "bestRating": "5",
            "worstRating": "1"
          }
        })
      }
    }))
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <div 
        className="mt-6 sm:mt-8 md:mt-12 grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-6 md:px-8"
        role="region"
        aria-label="Gift suggestions"
      >
        <SuggestionsGridItems 
          suggestions={suggestions}
          onMoreLikeThis={onMoreLikeThis}
          isLoading={isLoading}
        />
      </div>
      
      {suggestions.length > 0 && (
        <SuggestionsActions
          onGenerateMore={onGenerateMore}
          onStartOver={onStartOver}
          isLoading={isLoading}
        />
      )}
    </>
  );
};