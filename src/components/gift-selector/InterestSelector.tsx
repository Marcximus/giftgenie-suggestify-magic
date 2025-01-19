import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { getInterests } from '@/utils/interest-utils';

interface InterestSelectorProps {
  selectedPerson: string;
  selectedAge: string;
  onSelect: (value: string) => void;
}

export const InterestSelector = ({ selectedPerson, selectedAge, onSelect }: InterestSelectorProps) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleInterestClick = (interest: string) => {
    let newInterests: string[];
    
    if (selectedInterests.includes(interest)) {
      newInterests = selectedInterests.filter(i => i !== interest);
    } else if (selectedInterests.length < 2) {
      newInterests = [...selectedInterests, interest];
    } else {
      return; // Don't allow more than 2 selections
    }
    
    setSelectedInterests(newInterests);
  };

  const handleContinue = () => {
    if (selectedInterests.length > 0) {
      onSelect(selectedInterests.join(' and ')); // Only call onSelect when user clicks continue
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Select up to 2 interests {selectedInterests.length > 0 && `(${selectedInterests.length}/2 selected)`}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-3xl mx-auto px-4">
        {getInterests(selectedPerson, selectedAge).map((interest) => (
          <Button
            key={interest.label}
            variant={selectedInterests.includes(interest.label) ? "default" : "outline"}
            onClick={() => handleInterestClick(interest.label)}
            className={`transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center ${
              selectedInterests.includes(interest.label) ? 'bg-primary text-white' : ''
            }`}
          >
            <span className="mr-2 shrink-0">{interest.icon}</span>
            <span className="flex-1 text-center">{interest.label}</span>
          </Button>
        ))}
      </div>
      {selectedInterests.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button 
            onClick={handleContinue}
            className="w-full max-w-xs"
          >
            Continue with {selectedInterests.length} interest{selectedInterests.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
};