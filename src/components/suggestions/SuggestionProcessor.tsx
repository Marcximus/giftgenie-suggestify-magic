import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { GiftSuggestion } from '@/types/suggestions';
import { generateCustomDescription } from "@/utils/descriptionUtils";

interface SuggestionProcessorProps {
  suggestion: GiftSuggestion;
  index: number;
  onProcessed: (optimizedTitle: string, customDescription: string) => void;
  isVisible: boolean;
}

export const SuggestionProcessor = ({ 
  suggestion, 
  index, 
  onProcessed,
  isVisible 
}: SuggestionProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isVisible || isProcessing || !suggestion.title) return;

    const processSuggestion = async () => {
      setIsProcessing(true);
      try {
        // Process title and description in parallel
        const [titleResponse, description] = await Promise.all([
          supabase.functions.invoke('generate-product-title', {
            body: { 
              title: suggestion.title.trim(),
              description: suggestion.description?.trim() 
            }
          }),
          generateCustomDescription(suggestion.title, suggestion.description || '')
        ]);

        const optimizedTitle = titleResponse.data?.title || suggestion.title;
        const customDescription = description || suggestion.description;

        onProcessed(optimizedTitle, customDescription);
      } catch (error) {
        console.error('Error processing suggestion:', error);
        // Fall back to original values
        onProcessed(suggestion.title, suggestion.description);
      } finally {
        setIsProcessing(false);
      }
    };

    processSuggestion();
  }, [suggestion, isVisible, onProcessed]);

  return null; // This is a logic-only component
};