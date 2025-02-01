import { useState } from 'react';

export const useSuggestionProcessing = () => {
  const [optimizedTitles, setOptimizedTitles] = useState<Record<string, string>>({});
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});

  const handleSuggestionProcessed = (
    originalTitle: string, 
    optimizedTitle: string, 
    customDescription: string
  ) => {
    setOptimizedTitles(prev => ({
      ...prev,
      [originalTitle]: optimizedTitle
    }));
    setCustomDescriptions(prev => ({
      ...prev,
      [originalTitle]: customDescription
    }));
  };

  return {
    optimizedTitles,
    customDescriptions,
    handleSuggestionProcessed
  };
};