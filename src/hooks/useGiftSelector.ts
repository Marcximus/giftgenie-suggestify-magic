import { useState, useCallback } from 'react';

export const useGiftSelector = (onUpdate: (query: string) => void) => {
  const [currentPhase, setCurrentPhase] = useState<'person' | 'age' | 'price' | 'interest' | 'complete'>('person');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');

  const updateSearchText = useCallback((phase: string, value: string) => {
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
  }, [selectedPerson, selectedAge, selectedPrice]);

  const handleSelection = useCallback((phase: string, value: string, onComplete?: (query: string) => void) => {
    console.log('Handling selection:', { phase, value });

    // First update the state based on the current phase
    switch (phase) {
      case 'person':
        setSelectedPerson(value);
        break;
      case 'age':
        setSelectedAge(value);
        break;
      case 'price':
        setSelectedPrice(value);
        break;
    }

    // Generate the query after state updates
    const query = updateSearchText(phase, value);
    
    // Handle phase transition and query updates
    if (phase === 'interest' && onComplete) {
      console.log('Completing with query:', query);
      onComplete(query);
      setCurrentPhase('complete');
    } else {
      // Update the query and advance to next phase
      console.log('Updating with query:', query);
      if (query) {
        onUpdate(query);
      }
      
      // Advance to next phase
      switch (phase) {
        case 'person':
          setCurrentPhase('age');
          break;
        case 'age':
          setCurrentPhase('price');
          break;
        case 'price':
          setCurrentPhase('interest');
          break;
      }
    }
  }, [updateSearchText, onUpdate]);

  const reset = useCallback(() => {
    console.log('Resetting selector state');
    setCurrentPhase('person');
    setSelectedPerson('');
    setSelectedAge('');
    setSelectedPrice('');
  }, []);

  return {
    currentPhase,
    selectedPerson,
    selectedAge,
    selectedPrice,
    handleSelection,
    reset
  };
};