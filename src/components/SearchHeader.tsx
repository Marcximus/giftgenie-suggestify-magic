import { lazy, Suspense } from 'react';
import { SearchBox } from './SearchBox';
import { LoadingMessage } from './search/LoadingMessage';

const DynamicGiftSelector = lazy(() => import('./DynamicGiftSelector'));

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchHeader = ({ onSearch, isLoading }: SearchHeaderProps) => {
  return (
    <div className="space-y-6">
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
      <LoadingMessage isLoading={isLoading} />
      <Suspense fallback={<div className="h-[200px] animate-pulse bg-gray-100 rounded-lg" />}>
        <DynamicGiftSelector />
      </Suspense>
    </div>
  );
};