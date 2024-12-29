import { Interest } from '@/types/gift-selector';
import { Music, Computer, Bike, CookingPot, Home, Camera, Plane, Book, Gamepad, Dumbbell, Palette, Leaf, Coffee, Wine, ShoppingBag, Cat } from 'lucide-react';

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
    { label: 'Gardening', icon: <Leaf /> },
  ];

  switch (person.toLowerCase()) {
    case 'father':
      return youngAdult ? [
        ...techInterests,
        { label: 'Sports', icon: <Bike /> },
        { label: 'BBQ', icon: <CookingPot /> },
        { label: 'DIY', icon: <Home /> },
        ...commonInterests,
      ] : [
        { label: 'DIY', icon: <Home /> },
        { label: 'Sports', icon: <Bike /> },
        { label: 'BBQ', icon: <CookingPot /> },
        ...commonInterests,
      ];
    
    case 'mother':
      return middleAged ? [
        ...homeInterests,
        { label: 'Shopping', icon: <ShoppingBag /> },
        { label: 'Spa', icon: <Leaf /> },
        ...commonInterests,
      ] : [
        ...lifestyleInterests,
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Yoga', icon: <Dumbbell /> },
        ...commonInterests,
      ];
    
    case 'sister':
      return youngAdult ? [
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Beauty', icon: <Palette /> },
        { label: 'Fitness', icon: <Dumbbell /> },
        { label: 'Social Media', icon: <Camera /> },
        ...commonInterests,
      ] : [
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Makeup', icon: <Palette /> },
        { label: 'Dancing', icon: <Music /> },
        ...commonInterests,
      ];
    
    case 'brother':
      return youngAdult ? [
        ...techInterests,
        { label: 'Sports', icon: <Bike /> },
        { label: 'Fitness', icon: <Dumbbell /> },
        ...commonInterests,
      ] : [
        { label: 'Gaming', icon: <Gamepad /> },
        { label: 'Sports', icon: <Bike /> },
        { label: 'Music', icon: <Music /> },
        ...commonInterests,
      ];
    
    case 'grandma':
      return [
        { label: 'Cats', icon: <Cat /> },
        { label: 'Cooking', icon: <CookingPot /> },
        { label: 'Knitting', icon: <Home /> },
        { label: 'Reading', icon: <Book /> },
        { label: 'Gardening', icon: <Leaf /> },
      ];
    
    case 'grandpa':
      return [
        { label: 'Gardening', icon: <Leaf /> },
        { label: 'Reading', icon: <Book /> },
        { label: 'History', icon: <Book /> },
        { label: 'Chess', icon: <Gamepad /> },
        { label: 'DIY', icon: <Home /> },
      ];
    
    case 'son':
      if (child) {
        return [
          { label: 'Games', icon: <Gamepad /> },
          { label: 'Sports', icon: <Bike /> },
          { label: 'Drawing', icon: <Palette /> },
          { label: 'Toys', icon: <Gamepad /> },
        ];
      }
      return teen ? [
        ...techInterests,
        { label: 'Sports', icon: <Bike /> },
        { label: 'Music', icon: <Music /> },
        { label: 'Gaming', icon: <Gamepad /> },
      ] : commonInterests;
    
    case 'daughter':
      if (child) {
        return [
          { label: 'Art', icon: <Palette /> },
          { label: 'Dance', icon: <Music /> },
          { label: 'Dolls', icon: <Home /> },
          { label: 'Crafts', icon: <Palette /> },
        ];
      }
      return teen ? [
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Beauty', icon: <Palette /> },
        { label: 'Social Media', icon: <Camera /> },
        { label: 'Music', icon: <Music /> },
      ] : commonInterests;
    
    case 'colleague':
      return [
        { label: 'Coffee', icon: <Coffee /> },
        { label: 'Books', icon: <Book /> },
        { label: 'Office Decor', icon: <Home /> },
        ...commonInterests,
      ];
    
    default:
      return commonInterests;
  }
};