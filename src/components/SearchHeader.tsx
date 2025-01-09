import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => 
          prev < loadingMessages.length - 1 ? prev + 1 : prev
        );
      }, 2000);
    } else {
      setCurrentLoadingMessage(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  return (
    <div className="space-y-6">
      <DynamicGiftSelector onGiftSelect={onSearch} />
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
      {isLoading && (
        <p className="text-primary/80 animate-pulse text-sm md:text-base font-medium">
          {loadingMessages[currentLoadingMessage]}
        </p>
      )}
    </div>
  );
};