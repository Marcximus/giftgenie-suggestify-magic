import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SearchTitle } from './search/SearchTitle';
import { SearchInput } from './search/SearchInput';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBox = ({ onSearch, isLoading }: SearchBoxProps) => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    } else {
      toast({
        title: "Empty search",
        description: "Please enter a search term.",
        variant: "destructive",
      });
    }
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
          onReset={() => setQuery('')}
          isLoading={isLoading}
          showSelector={false}
        />
      </div>
    </div>
  );
};