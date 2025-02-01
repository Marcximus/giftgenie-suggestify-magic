import { useState, useEffect } from 'react';
import { GiftSuggestion } from '@/types/suggestions';

export const useVisibilityAnimation = (
  suggestions: GiftSuggestion[],
  onAllSuggestionsProcessed: (allProcessed: boolean) => void
) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    onAllSuggestionsProcessed(false);
    
    if (!suggestions.length) {
      return;
    }

    // Show first item immediately
    setVisibleCount(1);

    // Set up visibility animation for remaining items
    const timeouts = suggestions.slice(1).map((_, index) => {
      return setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 1, suggestions.length));
      }, (index + 1) * 50);
    });

    // Set final visibility after all animations
    const finalTimeout = setTimeout(() => {
      setVisibleCount(suggestions.length);
      onAllSuggestionsProcessed(true);
    }, suggestions.length * 50 + 300);
    
    timeouts.push(finalTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [suggestions, onAllSuggestionsProcessed]);

  return visibleCount;
};