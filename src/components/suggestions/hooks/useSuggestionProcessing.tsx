
import { useState, useEffect, useCallback, useMemo } from 'react';
import { GiftSuggestion } from '@/types/suggestions';
import { getDescriptionFromCache } from '@/utils/descriptionUtils';

interface UseSuggestionProcessingProps {
  suggestions: GiftSuggestion[];
  isLoading: boolean;
  onAllSuggestionsProcessed: (allProcessed: boolean) => void;
}

export const useSuggestionProcessing = ({
  suggestions,
  isLoading,
  onAllSuggestionsProcessed
}: UseSuggestionProcessingProps) => {
  const [visibleSuggestions, setVisibleSuggestions] = useState<GiftSuggestion[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  // Get cached descriptions without updating state during render
  const cachedDescriptions = useMemo(() => {
    const descriptionsMap: Record<string, string> = {};
    
    suggestions.forEach(suggestion => {
      if (suggestion.title) {
        // Get description from cache (only reads, no writes)
        const cachedDescription = getDescriptionFromCache(suggestion.title);
        if (cachedDescription) {
          descriptionsMap[suggestion.title] = cachedDescription;
        }
      }
    });
    
    return descriptionsMap;
  }, [suggestions]);

  // Update visible suggestions when loading state or suggestions change
  useEffect(() => {
    if (isLoading && suggestions.length === 0) {
      setVisibleSuggestions([]);
      setProcessedCount(0);
      return;
    }

    // Show all suggestions that have required data
    const readySuggestions = suggestions.filter(s => s.title);
    console.log(`Adding ${readySuggestions.length} ready suggestions immediately`);
    setVisibleSuggestions(readySuggestions);
    setProcessedCount(readySuggestions.length);
    
    // Signal that all suggestions are ready
    onAllSuggestionsProcessed(readySuggestions.length >= suggestions.length);
  }, [suggestions, isLoading, onAllSuggestionsProcessed]);

  return {
    visibleSuggestions,
    cachedDescriptions,
    processedCount
  };
};
