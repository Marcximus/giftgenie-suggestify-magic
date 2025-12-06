
import { useEffect, useRef, useMemo } from 'react';
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
  const hasShownConfetti = useRef(false);

  useEffect(() => {
    // Trigger confetti when suggestions first appear
    if (suggestions.length > 0 && !hasShownConfetti.current && !isLoading) {
      hasShownConfetti.current = true;

      // Lazy load confetti library only when needed
      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;

        // Optimized confetti with better performance
        const duration = 2000; // 2 seconds - balanced
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 50,
          zIndex: 0,
          decay: 0.95
        };

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min;
        };

        let frameId: number;
        let lastTime = Date.now();

        const animate = () => {
          const now = Date.now();
          const timeLeft = animationEnd - now;

          if (timeLeft <= 0) {
            return;
          }

          // Fire confetti every 250ms for good visual effect
          if (now - lastTime >= 250) {
            lastTime = now;

            // MORE particles at the start, fewer at the end (reversed calculation)
            const progress = timeLeft / duration;
            const particleCount = Math.floor(30 * progress); // Starts at 30, reduces to 0

            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
          }

          frameId = requestAnimationFrame(animate);
        };

        // Start animation using requestAnimationFrame
        frameId = requestAnimationFrame(animate);

        // Cleanup function
        return () => {
          if (frameId) {
            cancelAnimationFrame(frameId);
          }
        };
      });
    }

    // Reset confetti flag when suggestions are cleared
    if (suggestions.length === 0) {
      hasShownConfetti.current = false;
    }
  }, [suggestions.length, isLoading]);

  // Memoize schema data to prevent recalculation on every render
  const schemaData = useMemo(() => ({
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
  }), [suggestions]);

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <div 
        className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-4 sm:px-6 md:px-8"
        role="region"
        aria-label="Gift suggestions"
      >
        <SuggestionsGridItems 
          suggestions={suggestions}
          onMoreLikeThis={onMoreLikeThis}
          isLoading={isLoading}
          onAllSuggestionsProcessed={(allProcessed) => {
            // This callback will be triggered when all suggestions are processed
            const footer = document.querySelector('.suggestions-footer');
            if (footer) {
              if (allProcessed) {
                footer.classList.remove('opacity-0');
                footer.classList.add('opacity-100');
              } else {
                footer.classList.remove('opacity-100');
                footer.classList.add('opacity-0');
              }
            }
          }}
        />
      </div>
      
      {/* Show footer when suggestions are available, even during loading */}
      {suggestions.length > 0 && (
        <div 
          className={`suggestions-footer flex flex-col items-center mt-8 sm:mt-12 transition-opacity duration-500 ${!isLoading && 'opacity-100'}`}
          aria-hidden={isLoading}
        >
          <p className="text-sm text-muted-foreground mb-6 text-center px-4">
            Products shown may include affiliate links from Amazon and other vendors
          </p>
          <SuggestionsActions
            onGenerateMore={onGenerateMore}
            onStartOver={onStartOver}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
};
