import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { User, Users, Baby, Heart, Music, Computer, CookingPot, Home, Camera, Bike, Plane, DollarSign, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";

interface SelectorProps {
  onSelectionComplete: (query: string) => void;
}

type Person = {
  label: string;
  icon: JSX.Element;
};

type AgeRange = {
  label: string;
  range: string;
};

type PriceRange = {
  label: string;
  range: string;
};

type Interest = {
  label: string;
  icon: JSX.Element;
};

export const DynamicGiftSelector = ({ onSelectionComplete }: SelectorProps) => {
  const [currentPhase, setCurrentPhase] = useState<'person' | 'age' | 'price' | 'interest' | 'complete'>('person');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [visible, setVisible] = useState(true);

  const people: Person[] = [
    { label: 'Father', icon: <User /> },
    { label: 'Mother', icon: <User /> },
    { label: 'Brother', icon: <User /> },
    { label: 'Sister', icon: <User /> },
    { label: 'Grandma', icon: <Heart /> },
    { label: 'Grandpa', icon: <Heart /> },
    { label: 'Son', icon: <Baby /> },
    { label: 'Daughter', icon: <Baby /> },
    { label: 'Colleague', icon: <Users /> },
  ];

  const ageRanges: AgeRange[] = [
    { label: '0+', range: '0-4' },
    { label: '5+', range: '5-9' },
    { label: '10+', range: '10-14' },
    { label: '15+', range: '15-19' },
    { label: '20-30', range: '20-30' },
    { label: '30-40', range: '30-40' },
    { label: '40-50', range: '40-50' },
    { label: '50-60', range: '50-60' },
    { label: '60-80', range: '60-80' },
    { label: '80+', range: '80+' },
  ];

  const priceRanges: PriceRange[] = [
    { label: '$5-20', range: '5-20' },
    { label: '$20-40', range: '20-40' },
    { label: '$40-60', range: '40-60' },
    { label: '$60-100', range: '60-100' },
    { label: '$100-200', range: '100-200' },
    { label: '$200-400', range: '200-400' },
    { label: '$400-800', range: '400-800' },
    { label: '$800+', range: '800+' },
  ];

  const getInterests = (person: string, ageRange: string): Interest[] => {
    const youngAdult = ['20-30', '30-40'].includes(ageRange);
    const middleAged = ['40-50', '50-60'].includes(ageRange);
    const senior = ['60-80', '80+'].includes(ageRange);
    const child = ['0-4', '5-9', '10-14'].includes(ageRange);
    const teen = ['15-19'].includes(ageRange);

    const commonInterests = [
      { label: 'Music', icon: <Music /> },
      { label: 'Travel', icon: <Plane /> },
    ];

    switch (person.toLowerCase()) {
      case 'father':
      case 'brother':
        return [
          { label: 'Tech', icon: <Computer /> },
          { label: 'Sports', icon: <Bike /> },
          ...commonInterests,
        ];
      case 'mother':
      case 'sister':
        return middleAged ? [
          { label: 'Cooking', icon: <CookingPot /> },
          { label: 'Home Decor', icon: <Home /> },
          { label: 'Photography', icon: <Camera /> },
          ...commonInterests,
        ] : [
          { label: 'Tech', icon: <Computer /> },
          ...commonInterests,
        ];
      case 'grandma':
      case 'grandpa':
        return [
          { label: 'Home Decor', icon: <Home /> },
          { label: 'Cooking', icon: <CookingPot /> },
          ...commonInterests,
        ];
      default:
        return commonInterests;
    }
  };

  const handleSelection = (phase: string, value: string) => {
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
        const query = `Gift ideas for a ${selectedAge} year old ${selectedPerson.toLowerCase()} who likes ${value.toLowerCase()} with a budget of $${selectedPrice}`;
        onSelectionComplete(query);
        setCurrentPhase('complete');
        setVisible(false);
        break;
    }
  };

  if (!visible) return null;

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
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