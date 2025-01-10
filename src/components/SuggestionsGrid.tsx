import { GiftSuggestion } from '@/types/suggestions';
import { SuggestionsGridItems } from './suggestions/SuggestionsGridItems';
import { SuggestionsActions } from './suggestions/SuggestionsActions';
import { extractPriceValue } from './ProductCard';

interface SuggestionsGridProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  onGenerateMore: () => void;
  onStartOver: () => void;
  isLoading: boolean;
}

const filterSuggestionsByPrice = (suggestions: GiftSuggestion[], priceRange?: string): GiftSuggestion[] => {
  if (!priceRange) return suggestions;

  const [minStr, maxStr] = priceRange.split('-').map(p => p.trim());
  const minPrice = parseFloat(minStr);
  const maxPrice = parseFloat(maxStr);

  return suggestions.filter(suggestion => {
    const price = suggestion.amazon_price || extractPriceValue(suggestion.priceRange);
    return price >= minPrice && price <= maxPrice;
  });
};

export const SuggestionsGrid = ({ 
  suggestions, 
  onMoreLikeThis, 
  onGenerateMore,
  onStartOver,
  isLoading 
}: SuggestionsGridProps) => {
  // Extract price range from the first suggestion's search query
  const priceRangeMatch = suggestions[0]?.search_query?.match(/budget.*?(\d+)\s*-\s*(\d+)/i);
  const priceRange = priceRangeMatch ? `${priceRangeMatch[1]}-${priceRangeMatch[2]}` : undefined;

  // Filter suggestions based on price range
  const filteredSuggestions = filterSuggestionsByPrice(suggestions, priceRange);

  // Show message if no results in price range
  const noResultsInRange = suggestions.length > 0 && filteredSuggestions.length === 0;

  return (
    <>
      {noResultsInRange && (
        <div className="text-center text-muted-foreground mt-4">
          No results found within the specified price range. Showing all suggestions.
        </div>
      )}
      
      <div 
        className="mt-6 sm:mt-8 md:mt-12 grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-6 md:px-8"
        role="region"
        aria-label="Gift suggestions"
      >
        <SuggestionsGridItems 
          suggestions={noResultsInRange ? suggestions : filteredSuggestions}
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