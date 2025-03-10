
import { useEffect } from 'react';
import { PersonSelector } from './gift-selector/PersonSelector';
import { AgeSelector } from './gift-selector/AgeSelector';
import { PriceSelector } from './gift-selector/PriceSelector';
import { InterestSelector } from './gift-selector/InterestSelector';
import { useGiftSelector } from '@/hooks/useGiftSelector';

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
  const {
    currentPhase,
    selectedPerson,
    selectedAge,
    handleSelection,
    handleInterestUpdate,
    reset
  } = useGiftSelector(onUpdate);

  useEffect(() => {
    if (visible) {
      reset();
    }
  }, [visible, reset]);

  // Render null conditionally after all hooks are called
  const renderContent = () => {
    if (!visible) return null;

    return (
      <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
        {currentPhase === 'person' && (
          <PersonSelector
            selectedPerson={selectedPerson}
            onSelect={(value) => handleSelection('person', value)}
          />
        )}

        {currentPhase === 'age' && (
          <AgeSelector
            onSelect={(value) => handleSelection('age', value)}
          />
        )}

        {currentPhase === 'price' && (
          <PriceSelector
            onSelect={(value) => handleSelection('price', value)}
          />
        )}

        {currentPhase === 'interest' && (
          <InterestSelector
            selectedPerson={selectedPerson}
            selectedAge={selectedAge}
            onSelect={(value) => handleSelection('interest', value, onSelectionComplete)}
            onInterestUpdate={handleInterestUpdate}
          />
        )}
      </div>
    );
  };

  return renderContent();
};

export default DynamicGiftSelector;
