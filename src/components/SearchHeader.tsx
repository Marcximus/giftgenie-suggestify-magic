import { SearchBox } from './SearchBox';

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchHeader = ({ onSearch, isLoading }: SearchHeaderProps) => {
  return (
    <div className="max-w-3xl mx-auto mb-8 sm:mb-12 animate-in slide-in-from-top duration-500">
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
    </div>
  );
};