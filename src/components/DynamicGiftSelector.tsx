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
        onSelectionComplete(query);
        return;
    }
    
    onUpdate(query);
  };

  if (!visible) return null;

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      {currentPhase === 'person' && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-center text-muted-foreground">Who are you shopping for?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center mx-auto max-w-4xl">
            {people.map((person) => (
              <Button
                key={person.label}
                variant="outline"
                onClick={() => handleSelection('person', person.label)}
                className={cn(
                  "w-full max-w-[150px] h-[60px] transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2",
                  selectedPerson === person.label && "bg-primary text-primary-foreground"
                )}
              >
                <span className="text-lg">{person.icon}</span>
                <span>{person.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {currentPhase === 'age' && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-center text-muted-foreground">What's their age range?</h3>
          <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
            {ageRanges.map((age) => (
              <Button
                key={age.label}
                variant="outline"
                onClick={() => handleSelection('age', age.range)}
                className="h-[50px] min-w-[120px] transition-all duration-200 hover:scale-105"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {age.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {currentPhase === 'price' && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-center text-muted-foreground">What's your budget?</h3>
          <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
            {priceRanges.map((price) => (
              <Button
                key={price.label}
                variant="outline"
                onClick={() => handleSelection('price', price.range)}
                className="h-[50px] min-w-[120px] transition-all duration-200 hover:scale-105"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                {price.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {currentPhase === 'interest' && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-center text-muted-foreground">What are their interests?</h3>
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
            {getInterests(selectedPerson, selectedAge).map((interest) => (
              <Button
                key={interest.label}
                variant="outline"
                onClick={() => handleSelection('interest', interest.label)}
                className="h-[50px] min-w-[120px] transition-all duration-200 hover:scale-105"
              >
                <span className="mr-2">{interest.icon}</span>
                {interest.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};