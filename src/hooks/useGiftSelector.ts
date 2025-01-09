import { useState } from 'react';

export const useGiftSelector = (onUpdate: (query: string) => void) => {
  const [currentPhase, setCurrentPhase] = useState<'person' | 'age' | 'price' | 'interest' | 'complete'>('person');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');

  const updateSearchText = (phase: string, value: string) => {
    let query = '';
    
    switch (phase) {
      case 'person':
        query = `Gift for ${value.toLowerCase()}`;
        break;
      case 'age':
        query = selectedPerson ? `Gift for ${selectedPerson.toLowerCase()} (${value} years old)` : '';
        break;
      case 'price':
        query = selectedPerson && selectedAge ? 
          `Gift for ${selectedPerson.toLowerCase()} (${selectedAge} years old) - Budget: ${value}` : '';
        break;
      case 'interest':
        query = selectedPerson && selectedAge && selectedPrice ?
          `Gift ideas for a ${selectedAge} year old ${selectedPerson.toLowerCase()} who likes ${value.toLowerCase()} with a budget of ${selectedPrice}` : '';
        break;
      default:
        query = '';
    }
    
    return query;
  };

  const handleSelection = (phase: string, value: string, onComplete?: (query: string) => void) => {
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
        if (onComplete) {
          onComplete(query);
        }
        setCurrentPhase('complete');
        return;
    }
    
    if (query) {
      onUpdate(query);
    }
  };

  const reset = () => {
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