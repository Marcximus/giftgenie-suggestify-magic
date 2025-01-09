import { useState } from 'react';

export const useGiftSelector = (onUpdate: (query: string) => void) => {
  const [currentPhase, setCurrentPhase] = useState<'person' | 'age' | 'price' | 'interest' | 'complete'>('person');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');

  const updateSearchText = (phase: string, value: string) => {
    console.log('Updating search text:', { phase, value, selectedPerson, selectedAge, selectedPrice });
    
    let query = '';
    
    switch (phase) {
      case 'person':
        query = `Gift for ${value.toLowerCase()}`;
        break;
      case 'age':
        query = `Gift for ${selectedPerson.toLowerCase()} (${value} years old)`;
        break;
      case 'price':
        query = `Gift for ${selectedPerson.toLowerCase()} (${selectedAge} years old) - Budget: ${value}`;
        break;
      case 'interest':
        query = `Gift ideas for a ${selectedAge} year old ${selectedPerson.toLowerCase()} who likes ${value.toLowerCase()} with a budget of ${selectedPrice}`;
        break;
      default:
        query = '';
    }
    
    console.log('Generated query:', query);
    return query;
  };

  const handleSelection = (phase: string, value: string, onComplete?: (query: string) => void) => {
    console.log('Handling selection:', { phase, value });

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
        if (onComplete) {
          const finalQuery = updateSearchText(phase, value);
          console.log('Completing with query:', finalQuery);
          onComplete(finalQuery);
        }
        setCurrentPhase('complete');
        return;
    }
    
    const query = updateSearchText(phase, value);
    if (query) {
      console.log('Updating with query:', query);
      onUpdate(query);
    }
  };

  const reset = () => {
    console.log('Resetting selector state');
    setCurrentPhase('person');
    setSelectedPerson('');
    setSelectedAge('');
    setSelectedPrice('');
  };

  return {
    currentPhase,
    selectedPerson,
    selectedAge,
    selectedPrice,
    handleSelection,
    reset
  };
};