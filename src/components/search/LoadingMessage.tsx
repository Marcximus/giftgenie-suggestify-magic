import { useState, useEffect } from 'react';
import { loadingMessages } from './loadingMessages';
import { Spinner } from "@/components/ui/spinner";

interface LoadingMessageProps {
  isLoading: boolean;
}

export const LoadingMessage = ({ isLoading }: LoadingMessageProps) => {
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);

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
      shuffleMessages();
      setIsExiting(false);
    } else {
      setIsExiting(true);
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

  if (!isLoading && !isExiting) return null;

  return (
    <div 
      className={`flex flex-col items-center justify-center space-y-14 mt-12 sm:mt-16 ml-[-8%] sm:ml-[-4%] transition-all duration-300 ${
        isExiting ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
      }`}
      onTransitionEnd={() => {
        if (isExiting) setIsExiting(false);
      }}
    >
      <Spinner variant="infinite" className="w-16 h-16 sm:w-20 sm:h-20" />
      <p className="text-[#8E9196] text-center text-sm md:text-base font-medium max-w-md px-4 ml-[5%] animate-pulse-text">
        {shuffledMessages[currentLoadingMessage]}
      </p>
    </div>
  );
};
