import { useState, useEffect } from 'react';
import { SearchBox } from './SearchBox';

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const loadingMessages = [
  "Smuggling intel from the North Pole archives..",
  "Decoding hidden treasure maps...",
  "Shaking the present tree...",
  "Practicing psychic mind-reading on the receiver..",
  "Consulting the magic gardenome..",
  "Rubbing the genie's lamp..",
  "Putting on a detective hat for better suggestions..",
  "Performing the gift rain dance..",
  "Hacking into Santa's mainframe for extra data...",
  "Analyzing quantum gift physics..",
  "Consulting a wild pack of fortune cookies..",
  "Infiltrating the your receiver's wishful thinking..",
  "Eavesdropping on your receiver's secret confessions…",
  "Comparing notes with the North Pole's top giftologists...",
  "Brewing gift-giving magic...",
  "Sprinkling sparkle dust on the gift list...",
  "Inflating balloon animals for moral support...",
  "Tracking down that one unicorn who knows everything...",
  "Hacking into the receiver's mainframe",
  "Shaking the server until it spits something out…",
  "Intimidating the data into cooperating…",
  "Shoving zeros and ones into formation…",
  "Holding your browser hostage for suspense…",
  "Watching sparks fly as the code panics…",
  "Squeezing the API for hidden gems…",
  "Hoping the AI doesn't rebel before we find a gift…",
  "Forcing AI to care about your shopping crisis…",
  "Bribing the model with fresh data so it cooperates…",
  "Prying gift ideas out of AI's cold, digital hands…",
  "Here we go..."
];

export const SearchHeader = ({ onSearch, isLoading }: SearchHeaderProps) => {
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);

  // Function to shuffle messages but keep "Here we go..." at the end
  const shuffleMessages = () => {
    const messagesToShuffle = loadingMessages.slice(0, -1); // All messages except the last one
    const shuffled = [...messagesToShuffle]
      .sort(() => Math.random() - 0.5)
      .concat(loadingMessages[loadingMessages.length - 1]); // Add "Here we go..." at the end
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

  return (
    <div className="space-y-6">
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
      {isLoading && shuffledMessages.length > 0 && (
        <p className="text-[#8E9196] text-center animate-pulse text-sm md:text-base font-medium">
          {shuffledMessages[currentLoadingMessage]}
        </p>
      )}
    </div>
  );
};