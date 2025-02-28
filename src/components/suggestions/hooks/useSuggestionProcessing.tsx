
import { useState, useEffect, useRef } from 'react';
import { GiftSuggestion } from '@/types/suggestions';
import { generateCustomDescription } from "@/utils/descriptionUtils";

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
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
  const [visibleSuggestions, setVisibleSuggestions] = useState<GiftSuggestion[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const abortController = useRef<AbortController | null>(null);

  // Reset visible suggestions when a new search begins
  useEffect(() => {
    if (isLoading) {
      setVisibleSuggestions([]);
      setProcessedCount(0);
      // Don't reset customDescriptions as they are cached and can be reused
    }
  }, [isLoading]);

  // Process suggestions progressively as they arrive
  useEffect(() => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      setVisibleSuggestions([]);
      onAllSuggestionsProcessed(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    let processedSuggestions = 0;
    
    // Process new suggestions that aren't already visible
    const newSuggestions = suggestions.filter(
      suggestion => !visibleSuggestions.some(
        vs => vs.title === suggestion.title && vs.amazon_asin === suggestion.amazon_asin
      )
    );

    if (newSuggestions.length === 0) {
      // If we've processed all suggestions, mark as complete
      if (visibleSuggestions.length === suggestions.length) {
        onAllSuggestionsProcessed(true);
      }
      return;
    }

    console.log(`Processing ${newSuggestions.length} new suggestions`);
    console.log('Current custom descriptions state:', customDescriptions);

    const processSuggestions = async () => {
      // Immediately show suggestions with existing data
      const readySuggestions = newSuggestions.filter(
        s => s.amazon_image_url && s.amazon_price
      );
      
      if (readySuggestions.length > 0) {
        console.log(`Adding ${readySuggestions.length} ready suggestions immediately`);
        setVisibleSuggestions(prev => [...prev, ...readySuggestions]);
        processedSuggestions += readySuggestions.length;
        setProcessedCount(prev => prev + readySuggestions.length);
      }

      // Process the remaining suggestions with missing data
      const pendingSuggestions = newSuggestions.filter(
        s => !s.amazon_image_url || !s.amazon_price
      );

      console.log('Pending suggestions count:', pendingSuggestions.length);

      for (const suggestion of pendingSuggestions) {
        if (abortController.current?.signal.aborted) break;

        try {
          // Generate custom description if needed
          if (suggestion.title) {
            console.log('Generating custom description for:', suggestion.title);
            const customDescription = await generateCustomDescription(
              suggestion.title,
              suggestion.description
            );

            if (customDescription) {
              setCustomDescriptions(prev => ({
                ...prev,
                [suggestion.title]: customDescription
              }));
              
              console.log('Successfully generated custom description:', {
                title: suggestion.title,
                original: suggestion.description,
                custom: customDescription
              });
            }
          }

          // Add to visible suggestions as soon as processed
          setVisibleSuggestions(prev => [...prev, suggestion]);
          processedSuggestions++;
          setProcessedCount(prev => prev + 1);

          // Short delay between processing items to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Error processing suggestion:', error);
        }
      }

      // Check if all suggestions are now processed
      if (processedSuggestions === newSuggestions.length) {
        // If all suggestions are visible, mark as complete
        if (visibleSuggestions.length + processedSuggestions >= suggestions.length) {
          onAllSuggestionsProcessed(true);
        }
      }
    };

    processSuggestions();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [suggestions, visibleSuggestions, onAllSuggestionsProcessed, customDescriptions]);

  return {
    visibleSuggestions,
    customDescriptions,
    processedCount
  };
};
