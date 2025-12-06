'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSuggestions } from '@/hooks/useSuggestions';
import { SuggestionSkeleton } from '@/components/SuggestionSkeleton';
import { SearchHeader } from '@/components/SearchHeader';
import { SuggestionsGrid } from '@/components/SuggestionsGrid';

export function HomeClient() {
  const searchParams = useSearchParams();
  const {
    isLoading,
    suggestions,
    handleSearch,
    handleGenerateMore,
    handleMoreLikeThis,
    handleStartOver
  } = useSuggestions();

  // Handle URL query parameter on mount
  useEffect(() => {
    const queryParam = searchParams?.get('q') || searchParams?.get('query');
    if (queryParam && !suggestions.length && !isLoading) {
      console.log('Auto-executing search from URL:', queryParam);
      handleSearch(queryParam);
    }
  }, []); // Only run on mount

  return (
    <ErrorBoundary>
      <header>
        <h1 className="sr-only">Get The Gift - AI-Powered Gift Suggestions</h1>
        <SearchHeader onSearch={handleSearch} isLoading={isLoading} />
      </header>

      <section aria-label="Gift Suggestions" className="mb-4 sm:mb-8">
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
