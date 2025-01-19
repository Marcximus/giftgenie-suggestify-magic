import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSuggestions } from '@/hooks/useSuggestions';
import { SuggestionSkeleton } from '@/components/SuggestionSkeleton';

const SearchHeader = lazy(() => import('@/components/SearchHeader').then(module => ({ default: module.SearchHeader })));
const SuggestionsGrid = lazy(() => import('@/components/SuggestionsGrid').then(module => ({ default: module.SuggestionsGrid })));

const Index = () => {
  const {
    isLoading,
    suggestions,
    handleSearch,
    handleGenerateMore,
    handleMoreLikeThis,
    handleStartOver
  } = useSuggestions();

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 md:py-12 max-w-7xl">
          <header>
            <h1 className="sr-only">GiftGenie - AI-Powered Gift Suggestions</h1>
            <Suspense fallback={<div className="h-[200px] animate-pulse bg-gray-100 rounded-lg" />}>
              <SearchHeader onSearch={handleSearch} isLoading={isLoading} />
            </Suspense>
          </header>
          
          <section aria-label="Gift Suggestions" className="mt-8">
            {suggestions.length > 0 && (
              <Suspense fallback={
                <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          <footer className="mt-96 mb-4 text-center">
            <p className="text-[10px] text-muted-foreground/70">
              Some links may contain affiliate links from Amazon and other vendors
            </p>
          </footer>
        </div>
      </main>
    </ErrorBoundary>
  );
};

export default Index;