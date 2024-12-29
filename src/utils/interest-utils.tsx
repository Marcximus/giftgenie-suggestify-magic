import { Interest } from '@/types/gift-selector';
import { Music, Computer, Bike, CookingPot, Home, Camera, Plane, Book, Gamepad, Dumbbell, Palette, Leaf, Coffee, Wine, ShoppingBag } from 'lucide-react';

export const getInterests = (person: string, ageRange: string): Interest[] => {
  const youngAdult = ['20-30', '30-40'].includes(ageRange);
  const middleAged = ['40-50', '50-60'].includes(ageRange);
  const senior = ['60-80', '80+'].includes(ageRange);
  const child = ['0-4', '5-9', '10-14'].includes(ageRange);
  const teen = ['15-19'].includes(ageRange);

  const commonInterests = [
    { label: 'Music', icon: <Music /> },
    { label: 'Travel', icon: <Plane /> },
  ];

  const techInterests = [
    { label: 'Tech', icon: <Computer /> },
    { label: 'Gaming', icon: <Gamepad /> },
  ];

  const creativeInterests = [
    { label: 'Art', icon: <Palette /> },
    { label: 'Photography', icon: <Camera /> },
  ];

  const lifestyleInterests = [
    { label: 'Fitness', icon: <Dumbbell /> },
    { label: 'Coffee', icon: <Coffee /> },
    { label: 'Wine', icon: <Wine /> },
    { label: 'Shopping', icon: <ShoppingBag /> },
  ];

  const homeInterests = [
    { label: 'Cooking', icon: <CookingPot /> },
    { label: 'Home Decor', icon: <Home /> },
    { label: 'Plants', icon: <Leaf /> },
  ];

  switch (person.toLowerCase()) {
    case 'father':
    case 'brother':
      return youngAdult ? [
        ...techInterests,
        { label: 'Sports', icon: <Bike /> },
        ...commonInterests,
      ] : [
        ...homeInterests.slice(0, 1),
        { label: 'Sports', icon: <Bike /> },
        ...commonInterests,
      ];
    
    case 'mother':
    case 'sister':
      return middleAged ? [
        ...homeInterests,
        ...creativeInterests,
        ...commonInterests,
      ] : [
        ...lifestyleInterests,
        ...creativeInterests,
        ...commonInterests,
      ];
    
    case 'grandma':
    case 'grandpa':
      return [
        ...homeInterests,
        { label: 'Reading', icon: <Book /> },
        ...commonInterests,
      ];
    
    case 'son':
    case 'daughter':
      if (child) {
        return [
          { label: 'Games', icon: <Gamepad /> },
          { label: 'Art', icon: <Palette /> },
          ...commonInterests,
        ];
      }
      return teen ? [
        ...techInterests,
        ...lifestyleInterests.slice(0, 2),
        ...commonInterests,
      ] : commonInterests;
    
    case 'colleague':
      return [
        { label: 'Coffee', icon: <Coffee /> },
        { label: 'Books', icon: <Book /> },
        ...commonInterests,
      ];
    
    default:
      return commonInterests;
  }
};