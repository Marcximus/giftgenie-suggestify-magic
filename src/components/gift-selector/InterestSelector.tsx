
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { getInterests } from '@/utils/interest-utils';

interface InterestSelectorProps {
  selectedPerson: string;
  selectedAge: string;
  onSelect: (value: string) => void;
  onInterestUpdate: (interests: string[]) => void; // New prop for interest updates
}

export const InterestSelector = ({ 
  selectedPerson, 
  selectedAge, 
  onSelect, 
  onInterestUpdate 
}: InterestSelectorProps) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleInterestClick = (interest: string) => {
    let newInterests: string[];
    
    if (selectedInterests.includes(interest)) {
      newInterests = selectedInterests.filter(i => i !== interest);
      setSelectedInterests(newInterests);
    } else if (selectedInterests.length < 2) {
      newInterests = [...selectedInterests, interest];
      setSelectedInterests(newInterests);
      
      // If this is the second interest selected, trigger the search
      if (newInterests.length === 2) {
        onSelect(newInterests.join(' and '));
      }
    }
    
    // Always update parent with current interests
    onInterestUpdate(newInterests);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-3xl mx-auto px-4">
        {getInterests(selectedPerson, selectedAge).map((interest) => (
          <Button
            key={interest.label}
            variant={selectedInterests.includes(interest.label) ? "default" : "outline"}
            onClick={() => handleInterestClick(interest.label)}
            className={`transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center ${
              selectedInterests.includes(interest.label) 
                ? 'bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 text-white border border-white/20'
                : ''
            }`}
          >
            <span className="mr-2 shrink-0">{interest.icon}</span>
            <span className="flex-1 text-center">{interest.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
