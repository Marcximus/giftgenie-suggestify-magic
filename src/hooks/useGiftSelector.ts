import { useState } from 'react';

export const useGiftSelector = (onUpdate: (query: string) => void) => {
  const [currentPhase, setCurrentPhase] = useState<'person' | 'age' | 'price' | 'interest' | 'complete'>('person');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');

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
        onComplete?.(query);
        setCurrentPhase('complete');
        return;
    }
    
    onUpdate(query);
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