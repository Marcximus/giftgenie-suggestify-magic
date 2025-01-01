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
    console.log('Generated query:', query); // Debug log
    
    switch (phase) {
      case 'person':
        setSelectedPerson(value);
        setCurrentPhase('age');
        onUpdate(query);
        break;
      case 'age':
        setSelectedAge(value);
        setCurrentPhase('price');
        onUpdate(query);
        break;
      case 'price':
        setSelectedPrice(value);
        setCurrentPhase('interest');
        onUpdate(query);
        break;
      case 'interest':
        if (query.trim()) {
          console.log('Completing selection with query:', query); // Debug log
          onSelectionComplete(query);
          setCurrentPhase('complete');
        }
        break;
    }
  };

  if (!visible) return null;

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      {currentPhase === 'person' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-start mx-auto max-w-4xl">
          {people.map((person) => (
            <Button
              key={person.label}
              variant="outline"
              onClick={() => handleSelection('person', person.label)}
              className={cn(
                "w-full max-w-[150px] transition-all duration-200 hover:scale-105 flex items-center gap-2",
                selectedPerson === person.label && "bg-primary text-primary-foreground"
              )}
            >
              <span className="text-lg">{person.icon}</span>
              <span className="flex-1 text-center">{person.label}</span>
            </Button>
          ))}
        </div>
      )}

      {currentPhase === 'age' && (
        <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto px-4">
          {ageRanges.map((age) => (
            <Button
              key={age.label}
              variant="outline"
              onClick={() => handleSelection('age', age.range)}
              className="transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center"
            >
              <Calendar className="mr-2 h-4 w-4 shrink-0" />
              <span className="flex-1 text-center">{age.label}</span>
            </Button>
          ))}
        </div>
      )}

      {currentPhase === 'price' && (
        <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto px-4">
          {priceRanges.map((price) => (
            <Button
              key={price.label}
              variant="outline"
              onClick={() => handleSelection('price', price.range)}
              className="transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center"
            >
              <DollarSign className="mr-2 h-4 w-4 shrink-0" />
              <span className="flex-1 text-center">{price.label}</span>
            </Button>
          ))}
        </div>
      )}

      {currentPhase === 'interest' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-3xl mx-auto px-4">
          {getInterests(selectedPerson, selectedAge).map((interest) => (
            <Button
              key={interest.label}
              variant="outline"
              onClick={() => handleSelection('interest', interest.label)}
              className="transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center"
            >
              <span className="mr-2 shrink-0">{interest.icon}</span>
              <span className="flex-1 text-center">{interest.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicGiftSelector;