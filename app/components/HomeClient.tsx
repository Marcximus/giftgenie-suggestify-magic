'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSuggestions } from '@/hooks/useSuggestions';
import { SuggestionSkeleton } from '@/components/SuggestionSkeleton';
import { SearchHeader } from '@/components/SearchHeader';
import { SuggestionsGrid } from '@/components/SuggestionsGrid';
import { Button } from '@/components/ui/button';

export function HomeClient() {
  const searchParams = useSearchParams();
  const [searchAttempted, setSearchAttempted] = useState(false);
  const {
    isLoading,
    suggestions,
    handleSearch,
    handleGenerateMore,
    handleMoreLikeThis,
    handleStartOver
  } = useSuggestions();

  const onSearch = (query: string) => {
    setSearchAttempted(true);
    handleSearch(query);
  };

  // Handle URL query parameter on mount
  useEffect(() => {
    const queryParam = searchParams?.get('q') || searchParams?.get('query');
    if (queryParam && !suggestions.length && !isLoading) {
      setSearchAttempted(true);
      handleSearch(queryParam);
    }
  }, []); // Only run on mount

  const showEmptyState = searchAttempted && !isLoading && suggestions.length === 0;

  return (
    <ErrorBoundary>
      <header>
        <h1 className="sr-only">Get The Gift - AI-Powered Gift Suggestions</h1>
        <SearchHeader onSearch={onSearch} isLoading={isLoading} />
      </header>

      <section aria-label="Gift Suggestions" className="mb-4 sm:mb-8">
        {showEmptyState && (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No gift suggestions found</h3>
              <p className="text-sm text-gray-600 mb-6">
                We couldn't find any gift ideas matching your search. Try different keywords or be more specific about the occasion or recipient.
              </p>
              <Button
                onClick={() => {
                  setSearchAttempted(false);
                  handleStartOver();
                }}
                variant="default"
              >
                Try Another Search
              </Button>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <SuggestionsGrid
            suggestions={suggestions}
            onMoreLikeThis={handleMoreLikeThis}
            onGenerateMore={handleGenerateMore}
            onStartOver={handleStartOver}
            isLoading={isLoading}
          />
        )}
      </section>
    </ErrorBoundary>
  );
}
