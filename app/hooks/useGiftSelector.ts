import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

export const useGiftSelector = (onUpdate: (query: string) => void) => {
  const [currentPhase, setCurrentPhase] = useState<'person' | 'age' | 'price' | 'interest' | 'complete'>('person');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');

  const updateSearchText = useCallback((phase: string, value: string) => {
    logger.log('Updating search text:', { phase, value, selectedPerson, selectedAge, selectedPrice });
    
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
    
    logger.log('Generated query:', query);
    return query;
  }, [selectedPerson, selectedAge, selectedPrice]);

  const handleSelection = useCallback((phase: string, value: string, onComplete?: (query: string) => void) => {
    logger.log('Handling selection:', { phase, value });

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
      logger.log('Completing with query:', query);
      onComplete(query);
      setCurrentPhase('complete');
    } else {
      // Update the query and advance to next phase
      logger.log('Updating with query:', query);
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

  // New function to handle interest updates without triggering full search
  const handleInterestUpdate = useCallback((interests: string[]) => {
    logger.log('Interest update:', interests);
    
    if (interests.length > 0) {
      // Only update the search box with interests, without moving to the next phase
      const interestsText = interests.join(' and ');
      const query = `Gift ideas for a ${selectedAge} year old ${selectedPerson.toLowerCase()} who likes ${interestsText.toLowerCase()} with a budget of ${selectedPrice}`;
      
      logger.log('Updating query with interests:', query);
      onUpdate(query);
    } else {
      // If all interests are deselected, revert to the price phase query
      const query = `Gift for ${selectedPerson.toLowerCase()} (${selectedAge} years old) - Budget: ${selectedPrice}`;
      logger.log('Reverting to price phase query:', query);
      onUpdate(query);
    }
  }, [selectedPerson, selectedAge, selectedPrice, onUpdate]);

  const reset = useCallback(() => {
    logger.log('Resetting selector state');
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
    handleInterestUpdate,
    reset
  };
};
