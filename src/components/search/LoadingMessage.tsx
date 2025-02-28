import { useState, useEffect } from 'react';
import { loadingMessages } from './loadingMessages';
import { Spinner } from "@/components/ui/spinner";

interface LoadingMessageProps {
  isLoading: boolean;
}

export const LoadingMessage = ({ isLoading }: LoadingMessageProps) => {
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Function to shuffle messages but keep "Here we go..." at the end
  const shuffleMessages = () => {
    const messagesToShuffle = loadingMessages.slice(0, -1);
    const shuffled = [...messagesToShuffle]
      .sort(() => Math.random() - 0.5)
      .concat(loadingMessages[loadingMessages.length - 1]);
    setShuffledMessages(shuffled);
  };

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      shuffleMessages();
      setLoadingProgress(0);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => 
          prev < shuffledMessages.length - 1 ? prev + 1 : prev
        );
      }, 3500);

      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 85 ? 1 : 0.5;
          return Math.min(prev + increment, 95);
        });
      }, 500);
    } else {
      setLoadingProgress(100);
      setCurrentLoadingMessage(0);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading, shuffledMessages.length]);

  if (!isVisible || shuffledMessages.length === 0) return null;

  return (
    <div 
      className={`
        flex flex-col items-center justify-center space-y-8 mt-12 sm:mt-16 
        transition-all duration-500 ease-in-out
        ${isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
      aria-live="polite"
    >
      <div className="-ml-[12%] sm:-ml-[4%]">
        <Spinner variant="infinite" className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>
      <p className="text-[#8E9196] text-center text-sm md:text-base font-medium max-w-md px-4 animate-pulse-text">
        {shuffledMessages[currentLoadingMessage]}
      </p>
      
      <div className="w-full max-w-xs mt-4">
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1 dark:bg-gray-700">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          {loadingProgress < 95 ? 'Searching for the perfect gifts...' : 'Almost ready!'}
        </p>
      </div>
    </div>
  );
};
