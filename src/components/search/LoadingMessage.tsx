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
    } else {
      // Add a delay before hiding to allow for fade out animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => 
          prev < shuffledMessages.length - 1 ? prev + 1 : prev
        );
      }, 3500);
    } else {
      setCurrentLoadingMessage(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, shuffledMessages.length]);

  if (!isVisible || shuffledMessages.length === 0) return null;

  return (
    <div 
      className={`
        flex flex-col items-center justify-center space-y-14 mt-12 sm:mt-16 
        transition-all duration-500 ease-in-out
        ${isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
      aria-live="polite"
    >
      <div className="-ml-[3%]">
        <Spinner variant="infinite" className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>
      <p className="text-[#8E9196] text-center text-sm md:text-base font-medium max-w-md px-4 animate-pulse-text">
        {shuffledMessages[currentLoadingMessage]}
      </p>
    </div>
  );
};