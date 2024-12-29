import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign } from 'lucide-react';
import { cn } from "@/lib/utils";
import { people, ageRanges, priceRanges } from '@/data/gift-selector-data';
import { getInterests } from '@/utils/interest-utils';

interface SelectorProps {
  onSelectionComplete: (query: string) => void;
  onUpdate: (query: string) => void;
  onReset: () => void;
  visible: boolean;
}

export const DynamicGiftSelector = ({ 
  onSelectionComplete, 
  onUpdate,
  onReset,
  visible 
}: SelectorProps) => {
  const [currentPhase, setCurrentPhase] = useState<'person' | 'age' | 'price' | 'interest' | 'complete'>('person');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setCurrentPhase('person');
      setSelectedPerson('');
      setSelectedAge('');
      setSelectedPrice('');
    }
  }, [visible]);

  const updateSearchText = (phase: string, value: string) => {
    let query = '';
    
    if (phase === 'person') {
      query = `Gift for ${value.toLowerCase()}`;
    } else if (phase === 'age' && selectedPerson) {
      query = `Gift for ${selectedPerson.toLowerCase()} (${value} years old)`;
    } else if (phase === 'price' && selectedPerson && selectedAge) {
      query = `Gift for ${selectedPerson.toLowerCase()} (${selectedAge} years old) - Budget: ${value}`;
    } else if (phase === 'interest' && selectedPerson && selectedAge && selectedPrice) {
      query = `Gift ideas for a ${selectedAge} year old ${selectedPerson.toLowerCase()} who likes ${value.toLowerCase()} with a budget of ${selectedPrice}`;
    }
    
    return query;
  };

  const handleSelection = (phase: string, value: string) => {
    const query = updateSearchText(phase, value);
    
    switch (phase) {
      case 'person':
        setSelectedPerson(value);
        setCurrentPhase('age');
        break;
      case 'age':
        setSelectedAge(value);
        setCurrentPhase('price');
        break;
      case 'price':
        setSelectedPrice(value);
        setCurrentPhase('interest');
        break;
      case 'interest':
        // Only trigger the API call on the final interest selection
        onSelectionComplete(query);
        return;
    }
    
    // Update the search text without triggering the API call
    onUpdate(query);
  };

  if (!visible) return null;

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      {currentPhase === 'person' && (
        <div className="flex flex-wrap gap-2 justify-center">
          {people.map((person) => (
            <Button
              key={person.label}
              variant="outline"
              onClick={() => handleSelection('person', person.label)}
              className={cn(
                "transition-all duration-200 hover:scale-105",
                selectedPerson === person.label && "bg-primary text-primary-foreground"
              )}
            >
              {person.icon}
              {person.label}
            </Button>
          ))}
        </div>
      )}

      {currentPhase === 'age' && (
        <div className="flex flex-wrap gap-2 justify-center">
          {ageRanges.map((age) => (
            <Button
              key={age.label}
              variant="outline"
              onClick={() => handleSelection('age', age.range)}
              className="transition-all duration-200 hover:scale-105"
            >
              <Calendar className="mr-2" />
              {age.label}
            </Button>
          ))}
        </div>
      )}

      {currentPhase === 'price' && (
        <div className="flex flex-wrap gap-2 justify-center">
          {priceRanges.map((price) => (
            <Button
              key={price.label}
              variant="outline"
              onClick={() => handleSelection('price', price.range)}
              className="transition-all duration-200 hover:scale-105"
            >
              <DollarSign className="mr-2" />
              {price.label}
            </Button>
          ))}
        </div>
      )}

      {currentPhase === 'interest' && (
        <div className="flex flex-wrap gap-2 justify-center">
          {getInterests(selectedPerson, selectedAge).map((interest) => (
            <Button
              key={interest.label}
              variant="outline"
              onClick={() => handleSelection('interest', interest.label)}
              className="transition-all duration-200 hover:scale-105"
            >
              {interest.icon}
              {interest.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};