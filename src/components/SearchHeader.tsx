import { useState, useEffect } from 'react';
import { SearchBox } from './SearchBox';

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
      }, 3500); // Increased from 2000ms to 3500ms for slower transitions
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
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
      {isLoading && (
        <p className="text-[#8E9196] text-center animate-pulse text-sm md:text-base font-medium">
          {loadingMessages[currentLoadingMessage]}
        </p>
      )}
    </div>
  );
};