
import { useState, useEffect, useCallback } from 'react';
import { GiftSuggestion } from '@/types/suggestions';
import { generateCustomDescription } from '@/utils/descriptionUtils';

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
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
  const [processedCount, setProcessedCount] = useState(0);

  // Process descriptions in batches
  const processDescriptions = useCallback(async () => {
    const newDescriptions: Record<string, string> = { ...customDescriptions };
    let processedItems = 0;

    for (const suggestion of suggestions) {
      if (!suggestion.title) continue;
      
      // Skip if we already have a custom description for this title
      if (newDescriptions[suggestion.title]) {
        processedItems++;
        continue;
      }

      try {
        // Generate custom description
        const description = await generateCustomDescription(
          suggestion.title,
          suggestion.description
        );

        newDescriptions[suggestion.title] = description;
        processedItems++;

        // Update state incrementally
        setCustomDescriptions({ ...newDescriptions });
        setProcessedCount(processedItems);

        console.log('Generated custom description:', {
          title: suggestion.title,
          original: suggestion.description,
          custom: description
        });
      } catch (error) {
        console.error('Error processing suggestion description:', error);
        processedItems++;
      }
    }

    // Final update
    setCustomDescriptions(newDescriptions);
    setProcessedCount(processedItems);
    onAllSuggestionsProcessed(processedItems >= suggestions.length);
  }, [suggestions, customDescriptions, onAllSuggestionsProcessed]);

  // Update visible suggestions when loading state or suggestions change
  useEffect(() => {
    if (isLoading && suggestions.length === 0) {
      setVisibleSuggestions([]);
      return;
    }

    // Show all suggestions that have required data
    const readySuggestions = suggestions.filter(s => s.title);
    console.log(`Adding ${readySuggestions.length} ready suggestions immediately`);
    setVisibleSuggestions(readySuggestions);

    // Start processing descriptions
    if (readySuggestions.length > 0) {
      console.log(`Processing ${readySuggestions.length} new suggestions`);
      processDescriptions();
    }
  }, [suggestions, isLoading, processDescriptions]);

  return {
    visibleSuggestions,
    customDescriptions,
    processedCount
  };
};
