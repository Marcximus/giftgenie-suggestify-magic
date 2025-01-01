import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from 'lucide-react';
import { DynamicGiftSelector } from './DynamicGiftSelector';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBox = ({ onSearch, isLoading }: SearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [showSelector, setShowSelector] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowSelector(false);
    }
  };

  const handleSelectorComplete = (generatedQuery: string) => {
    setQuery(generatedQuery);
    onSearch(generatedQuery);
    setShowSelector(false);
  };

  const handleSelectorUpdate = (currentQuery: string) => {
    setQuery(currentQuery);
  };

  const handleReset = () => {
    setQuery('');
    setShowSelector(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-3xl mx-auto px-4">
      <div className="flex flex-col space-y-3 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-in fade-in slide-in-from-top-4 duration-700">
          Get The Gift
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
          Find the perfect gift with the power of AI: describe the person or occasion below
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
        <div className="flex-1 min-w-0 group">
          <textarea
            placeholder="E.g., 'Tech-savvy dad who loves cooking'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-h-[40px] max-h-[120px] text-sm sm:text-base p-3 rounded-md border border-input bg-background/50 backdrop-blur-sm resize-y overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 group-hover:border-primary/50"
            style={{ lineHeight: '1.5' }}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isLoading ? (
              <div className="loading-spinner">⌛</div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          {!showSelector && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap shadow-sm hover:shadow-md transition-all duration-200 hover:bg-secondary/80"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sm:hidden">New Search</span>
              <span className="hidden sm:inline">Look for another gift</span>
            </Button>
          )}
        </div>
      </div>
      
      <DynamicGiftSelector 
        onSelectionComplete={handleSelectorComplete}
        onUpdate={handleSelectorUpdate}
        onReset={handleReset}
        visible={showSelector}
      />
    </form>
  );
};
