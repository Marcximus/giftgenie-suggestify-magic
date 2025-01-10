import { lazy, Suspense, useState } from 'react';
import { SearchBox } from './SearchBox';
import { LoadingMessage } from './search/LoadingMessage';

const DynamicGiftSelector = lazy(() => import('./DynamicGiftSelector'));

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchHeader = ({ onSearch, isLoading }: SearchHeaderProps) => {
  const [showSelector, setShowSelector] = useState(true);

  const handleSelectorComplete = (query: string) => {
    onSearch(query);
    setShowSelector(false);
  };

  const handleSelectorUpdate = (query: string) => {
    // This is called when the selector updates but hasn't completed
    // We don't need to do anything here since the SearchBox handles the query updates
  };

  const handleReset = () => {
    setShowSelector(true);
  };

  return (
    <div className="space-y-6">
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
      <LoadingMessage isLoading={isLoading} />
      <Suspense fallback={<div className="h-[200px] animate-pulse bg-gray-100 rounded-lg" />}>
        <DynamicGiftSelector 
          onSelectionComplete={handleSelectorComplete}
          onUpdate={handleSelectorUpdate}
          onReset={handleReset}
          visible={showSelector}
        />
      </Suspense>
    </div>
  );
};