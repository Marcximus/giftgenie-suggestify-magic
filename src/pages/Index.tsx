
import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSuggestions } from '@/hooks/useSuggestions';
import { SuggestionSkeleton } from '@/components/SuggestionSkeleton';
import { IndexMeta } from '@/components/IndexMeta';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { SearchHeader } from '@/components/SearchHeader';
import { SuggestionsGrid } from '@/components/SuggestionsGrid';

const Index = () => {
  const [searchParams] = useSearchParams();
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
    const queryParam = searchParams.get('q') || searchParams.get('query');
    if (queryParam && !suggestions.length && !isLoading) {
      console.log('Auto-executing search from URL:', queryParam);
      handleSearch(queryParam);
    }
  }, []); // Only run on mount

  return (
    <>
      <IndexMeta />
      <ErrorBoundary>
        <main className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
          <div className="container mx-auto px-2 pt-2 sm:pt-6 pb-4 sm:pb-8 max-w-7xl">
            <BreadcrumbNav />
            <header>
              <h1 className="sr-only">GiftGenie - AI-Powered Gift Suggestions</h1>
              <Suspense fallback={<div className="h-[200px] animate-pulse bg-gray-100 rounded-lg" />}>
                <SearchHeader onSearch={handleSearch} isLoading={isLoading} />
              </Suspense>
            </header>
            
            <section aria-label="Gift Suggestions" className="mb-4 sm:mb-8">
              {suggestions.length > 0 && (
                <Suspense fallback={
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                      <SuggestionSkeleton key={i} />
                    ))}
                  </div>
                }>
                  <SuggestionsGrid
                    suggestions={suggestions}
                    onMoreLikeThis={handleMoreLikeThis}
                    onGenerateMore={handleGenerateMore}
                    onStartOver={handleStartOver}
                    isLoading={isLoading}
                  />
                </Suspense>
              )}
            </section>
          </div>
        </main>
      </ErrorBoundary>
    </>
  );
};

export default Index;
