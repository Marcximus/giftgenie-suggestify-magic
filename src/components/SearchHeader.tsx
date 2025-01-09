import { useState } from 'react';
import { SearchBox } from './SearchBox';
import { DynamicGiftSelector } from './DynamicGiftSelector';

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const loadingMessages = [
  "Asking the gift gods for advice...",
  "Comparing notes with Santa...",
  "Searching the Amazon forest...",
  "Here we go..."
];

export const SearchHeader = ({ onSearch, isLoading }: SearchHeaderProps) => {
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);

  // Update loading message every 2 seconds
  useState(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => 
          prev < loadingMessages.length - 1 ? prev + 1 : prev
        );
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setCurrentLoadingMessage(0);
    }
  }, [isLoading]);

  return (
    <div className="space-y-6">
      <DynamicGiftSelector onSearch={onSearch} />
      <SearchBox onSearch={onSearch} />
      {isLoading && (
        <p className="text-primary/80 animate-pulse text-sm md:text-base font-medium">
          {loadingMessages[currentLoadingMessage]}
        </p>
      )}
    </div>
  );
};