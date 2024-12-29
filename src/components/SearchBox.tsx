import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-center">Find the Perfect Gift</h1>
        <p className="text-muted-foreground text-center">
          Describe the person or occasion, or use our gift finder below
        </p>
      </div>
      <div className="flex space-x-2">
        <Input
          placeholder="E.g., 'Tech-savvy dad who loves cooking'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
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
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Look for another gift
          </Button>
        )}
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