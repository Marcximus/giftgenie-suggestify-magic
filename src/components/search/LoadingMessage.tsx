import { useState, useEffect } from 'react';
import { loadingMessages } from './loadingMessages';
import { Spinner } from "@/components/ui/spinner";

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
    <div className="flex flex-col items-center gap-4">
      <Spinner 
        variant="infinite" 
        className="w-12 h-12 [&>path]:stroke-[url(#spinner-gradient)]" 
        size={48}
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#9b87f5' }} />
            <stop offset="50%" style={{ stopColor: '#D946EF' }} />
            <stop offset="100%" style={{ stopColor: '#0EA5E9' }} />
          </linearGradient>
        </defs>
      </Spinner>
      <p className="text-[#8E9196] text-center text-sm md:text-base font-medium">
        {shuffledMessages[currentLoadingMessage]}
      </p>
    </div>
  );
};