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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full max-w-3xl mx-auto px-2 sm:px-4">
      <div className="flex flex-col space-y-2 sm:space-y-3 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
          Get The{' '}
          <span className="relative">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Gift
            </span>
            {/* Top stars */}
            <span className="absolute -top-2 left-1/4 w-2 h-2 bg-primary/80 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/80 animate-twinkle"></span>
            <span className="absolute -top-3 left-1/2 w-1 h-1 bg-primary/60 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/60 animate-twinkle-slow"></span>
            <span className="absolute -top-1 right-1/4 w-1.5 h-1.5 bg-primary/70 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/70 animate-twinkle-delayed"></span>
            
            {/* Middle stars */}
            <span className="absolute top-1/3 -left-3 w-1.5 h-1.5 bg-primary/60 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/60 animate-twinkle-super-slow"></span>
            <span className="absolute top-1/2 left-1/3 w-1 h-1 bg-primary/70 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/70 animate-twinkle-fast"></span>
            <span className="absolute top-1/2 right-1 w-2 h-2 bg-primary/80 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/80 animate-twinkle-medium"></span>
            
            {/* Bottom stars */}
            <span className="absolute -bottom-2 left-1/3 w-1.5 h-1.5 bg-primary/70 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/70 animate-twinkle-delayed-slow"></span>
            <span className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-primary/60 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/60 animate-twinkle-medium"></span>
            <span className="absolute -bottom-3 right-1/2 w-2 h-2 bg-primary/80 rotate-45 before:absolute before:inset-0 before:rotate-45 before:bg-primary/80 animate-twinkle-fast"></span>
          </span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground animate-in fade-in slide-in-from-top-4 duration-700 delay-150 px-2">
          Find the perfect gift with the power of AI: describe the person or occasion below
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
        <div className="flex-1 min-w-0 group">
          <textarea
            placeholder="E.g., 'Tech-savvy dad who loves cooking'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-h-[40px] max-h-[120px] text-sm sm:text-base p-2 sm:p-3 rounded-md border border-input bg-background/50 backdrop-blur-sm resize-y overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 group-hover:border-primary/50"
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
              <span className="text-xs sm:text-sm">New Search</span>
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
