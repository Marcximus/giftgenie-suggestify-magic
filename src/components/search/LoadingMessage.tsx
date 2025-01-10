import { useState, useEffect } from 'react';
import { loadingMessages } from './loadingMessages';

interface LoadingMessageProps {
  isLoading: boolean;
}

export const LoadingMessage = ({ isLoading }: LoadingMessageProps) => {
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);

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

  if (!isLoading || shuffledMessages.length === 0) return null;

  return (
    <p className="text-[#8E9196] text-center animate-pulse text-sm md:text-base font-medium">
      {shuffledMessages[currentLoadingMessage]}
    </p>
  );
};
