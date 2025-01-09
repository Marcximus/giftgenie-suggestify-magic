import { ProductCard } from './ProductCard';
import { Button } from './ui/button';
import { Sparkles, RotateCcw } from 'lucide-react';
import { SuggestionSkeleton } from './SuggestionSkeleton';

interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
  amazon_asin?: string;
  amazon_url?: string;
  amazon_price?: number;
  amazon_image_url?: string;
  amazon_rating?: number;
  amazon_total_ratings?: number;
}

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
  return (
    <>
      <div className="mt-6 sm:mt-8 md:mt-12 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
              <SuggestionSkeleton />
            </div>
          ))
        ) : (
          suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards' 
              }}
            >
              <ProductCard
                title={suggestion.title}
                description={`${suggestion.description}\n\nWhy this gift? ${suggestion.reason}`}
                price={suggestion.amazon_price ? suggestion.amazon_price.toString() : suggestion.priceRange}
                amazonUrl={suggestion.amazon_url || "#"}
                imageUrl={suggestion.amazon_image_url}
                rating={suggestion.amazon_rating}
                totalRatings={suggestion.amazon_total_ratings}
                asin={suggestion.amazon_asin}
                onMoreLikeThis={onMoreLikeThis}
              />
            </div>
          ))
        )}
      </div>
      
      {suggestions.length > 0 && (
        <div className="flex justify-center gap-3 mt-8 sm:mt-12">
          <Button
            onClick={onGenerateMore}
            disabled={isLoading}
            className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2 animate-pulse group-hover:animate-none" />
            Generate More Ideas
          </Button>
          <Button
            onClick={onStartOver}
            variant="outline"
            className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-secondary/80"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
        </div>
      )}
    </>
  );
};