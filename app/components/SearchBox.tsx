import { useState, useCallback } from 'react';
import { DynamicGiftSelector } from './DynamicGiftSelector';
import { useToast } from '@/components/ui/use-toast';
import { SearchTitle } from './search/SearchTitle';
import { SearchInput } from './search/SearchInput';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 200;

export const SearchBox = ({ onSearch, isLoading }: SearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [showSelector, setShowSelector] = useState(true);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a search term or use the gift selector below.",
        variant: "destructive",
      });
      return;
    }

    if (query.trim().length < MIN_QUERY_LENGTH) {
      toast({
        title: "Search too short",
        description: `Please enter at least ${MIN_QUERY_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }

    if (query.length > MAX_QUERY_LENGTH) {
      toast({
        title: "Search too long",
        description: `Search must be under ${MAX_QUERY_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }

    onSearch(query);
    setShowSelector(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-3xl mx-auto px-2 sm:px-4">
      <SearchTitle />
      <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
        <SearchInput
          query={query}
          onQueryChange={handleInputChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isLoading={isLoading}
          showSelector={showSelector}
        />
      </div>
      <DynamicGiftSelector 
        onSelectionComplete={handleSelectorComplete}
        onUpdate={handleSelectorUpdate}
        onReset={handleReset}
        visible={showSelector}
      />
    </div>
  );
};