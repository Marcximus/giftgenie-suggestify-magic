import { useState, useEffect } from 'react';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { SuggestionProcessor } from './SuggestionProcessor';
import { AnimatedSuggestionCard } from './AnimatedSuggestionCard';

interface SuggestionsGridItemsProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  isLoading: boolean;
  onAllSuggestionsProcessed: (allProcessed: boolean) => void;
}

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading,
  onAllSuggestionsProcessed
}: SuggestionsGridItemsProps) => {
  const [optimizedTitles, setOptimizedTitles] = useState<Record<string, string>>({});
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    // Reset state when suggestions change
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

  const handleSuggestionProcessed = (originalTitle: string, optimizedTitle: string, customDescription: string) => {
    setOptimizedTitles(prev => ({
      ...prev,
      [originalTitle]: optimizedTitle
    }));
    setCustomDescriptions(prev => ({
      ...prev,
      [originalTitle]: customDescription
    }));
  };

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={`skeleton-${index}`}
            className="animate-in fade-in duration-300 ease-out"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SuggestionSkeleton />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {suggestions.map((suggestion, index) => (
        <div key={`suggestion-${index}`}>
          <SuggestionProcessor
            suggestion={suggestion}
            index={index}
            isVisible={index < visibleCount}
            onProcessed={(optimizedTitle, customDescription) => 
              handleSuggestionProcessed(suggestion.title, optimizedTitle, customDescription)
            }
          />
          <AnimatedSuggestionCard
            suggestion={suggestion}
            index={index}
            visibleCount={visibleCount}
            optimizedTitle={optimizedTitles[suggestion.title]}
            customDescription={customDescriptions[suggestion.title]}
            onMoreLikeThis={onMoreLikeThis}
          />
        </div>
      ))}
    </>
  );
};