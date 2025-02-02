import { lazy, Suspense } from 'react';
import { SearchBox } from './SearchBox';
import { LoadingMessage } from './search/LoadingMessage';
import { DownloadSearchReport } from './search/DownloadSearchReport';

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchHeader = ({ onSearch, isLoading }: SearchHeaderProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <SearchBox onSearch={onSearch} isLoading={isLoading} />
        <DownloadSearchReport />
      </div>
      <LoadingMessage isLoading={isLoading} />
    </div>
  );
};