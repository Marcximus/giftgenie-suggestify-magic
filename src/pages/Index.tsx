import { SearchHeader } from '@/components/SearchHeader';
import { SuggestionsGrid } from '@/components/SuggestionsGrid';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSuggestions } from '@/hooks/useSuggestions';

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
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 md:py-12 max-w-7xl">
          <SearchHeader onSearch={handleSearch} isLoading={isLoading} />
          
          {suggestions.length > 0 && (
            <SuggestionsGrid
              suggestions={suggestions}
              onMoreLikeThis={handleMoreLikeThis}
              onGenerateMore={handleGenerateMore}
              onStartOver={handleStartOver}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Index;