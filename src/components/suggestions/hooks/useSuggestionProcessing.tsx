
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
    }
  }, [isLoading]);

  // Process suggestions progressively as they arrive
  useEffect(() => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      setCustomDescriptions({});
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
      console.log('Current custom descriptions state:', customDescriptions);

      for (const suggestion of pendingSuggestions) {
        if (abortController.current?.signal.aborted) break;

        try {
          const title = suggestion.title;
          
          if (!title) {
            console.error('Suggestion is missing title:', suggestion);
            continue;
          }

          // Generate custom description if needed
          if (!customDescriptions[title]) {
            console.log('Generating custom description for:', title);
            const originalDesc = suggestion.description || title;
            
            const customDescription = await generateCustomDescription(
              title,
              originalDesc
            );

            if (customDescription) {
              console.log('Successfully generated custom description:', {
                title,
                original: originalDesc,
                custom: customDescription
              });
              
              setCustomDescriptions(prev => {
                const updated = { ...prev };
                updated[title] = customDescription;
                console.log('Updated customDescriptions state:', updated);
                return updated;
              });
            } else {
              console.error('Failed to generate custom description for:', title);
            }
          } else {
            console.log('Using existing custom description for:', title);
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
