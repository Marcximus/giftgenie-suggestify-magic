import { lazy, Suspense } from 'react';
import { SearchBox } from './SearchBox';
import { LoadingMessage } from './search/LoadingMessage';

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchHeader = ({ onSearch, isLoading }: SearchHeaderProps) => {
  return (
    <div className="space-y-2">
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
      <LoadingMessage isLoading={isLoading} />
    </div>
  );
};