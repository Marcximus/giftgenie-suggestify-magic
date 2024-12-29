import { Interest } from '@/types/gift-selector';
import { commonInterests } from '@/data/common-interests';
import { techInterests } from '@/data/tech-interests';
import { creativeInterests } from '@/data/creative-interests';
import { lifestyleInterests } from '@/data/lifestyle-interests';
import { homeInterests } from '@/data/home-interests';
import { getChildInterests } from '@/data/child-interests';
import { getTeenInterests } from '@/data/teen-interests';
import { 
  Trophy, CookingPot, Home, Book, Heart, 
  ShoppingBag, Dumbbell, Palette, Cat, Coffee 
} from 'lucide-react';

const romanticInterests: Interest[] = [
  { label: 'Anniversary', icon: <Heart /> },
  { label: "Valentine's Day", icon: <Heart /> },
];

export const getInterests = (person: string, ageRange: string): Interest[] => {
  const youngAdult = ['20-30', '30-40'].includes(ageRange);
  const middleAged = ['40-50', '50-60'].includes(ageRange);
  const senior = ['60-80', '80+'].includes(ageRange);
  const child = ['0-4', '5-9', '10-14'].includes(ageRange);
  const teen = ['15-19'].includes(ageRange);

  switch (person.toLowerCase()) {
    case 'wife':
      return [
        ...romanticInterests,
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Jewelry', icon: <Heart /> },
        ...lifestyleInterests,
        ...homeInterests,
        ...commonInterests,
      ];
    
    case 'husband':
      return [
        ...romanticInterests,
        ...techInterests,
        { label: 'Sports', icon: <Trophy /> },
        { label: 'DIY', icon: <Home /> },
        ...commonInterests,
      ];

    case 'boyfriend':
      return youngAdult ? [
        ...romanticInterests,
        ...techInterests,
        { label: 'Sports', icon: <Trophy /> },
        ...commonInterests,
        { label: 'Fitness', icon: <Dumbbell /> },
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Coffee', icon: <Coffee /> },
        ...creativeInterests,
      ] : [
        ...romanticInterests,
        { label: 'Sports', icon: <Trophy /> },
        ...techInterests,
        ...commonInterests,
      ];

    case 'girlfriend':
      return youngAdult ? [
        ...romanticInterests,
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Beauty', icon: <Heart /> },
        ...creativeInterests,
        ...commonInterests,
        { label: 'Fitness', icon: <Dumbbell /> },
        { label: 'Shopping', icon: <ShoppingBag /> },
        ...homeInterests,
      ] : [
        ...romanticInterests,
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Beauty', icon: <Heart /> },
        ...commonInterests,
        ...creativeInterests,
      ];
    
    case 'father':
      return youngAdult ? [
        ...techInterests,
        { label: 'Sports', icon: <Trophy /> },
        { label: 'BBQ', icon: <CookingPot /> },
        { label: 'DIY', icon: <Home /> },
        ...commonInterests,
      ] : [
        { label: 'DIY', icon: <Home /> },
        { label: 'Sports', icon: <Trophy /> },
        { label: 'BBQ', icon: <CookingPot /> },
        ...commonInterests,
      ];
    
    case 'mother':
      return middleAged ? [
        ...homeInterests,
        { label: 'Shopping', icon: <ShoppingBag /> },
        { label: 'Spa', icon: <Home /> },
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
        { label: 'Social Media', icon: <Heart /> },
        ...commonInterests,
      ] : [
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Makeup', icon: <Palette /> },
        { label: 'Dancing', icon: <Heart /> },
        ...commonInterests,
      ];
    
    case 'brother':
      return youngAdult ? [
        ...techInterests,
        { label: 'Sports', icon: <Trophy /> },
        { label: 'Fitness', icon: <Dumbbell /> },
        ...commonInterests,
      ] : [
        ...techInterests,
        { label: 'Sports', icon: <Trophy /> },
        ...commonInterests,
      ];
    
    case 'grandma':
      return [
        { label: 'Cats', icon: <Cat /> },
        { label: 'Cooking', icon: <CookingPot /> },
        { label: 'Knitting', icon: <Home /> },
        { label: 'Reading', icon: <Book /> },
        { label: 'Gardening', icon: <Home /> },
      ];
    
    case 'grandpa':
      return [
        { label: 'Gardening', icon: <Home /> },
        { label: 'Reading', icon: <Book /> },
        { label: 'History', icon: <Book /> },
        { label: 'Chess', icon: <Trophy /> },
        { label: 'DIY', icon: <Home /> },
      ];

    case 'son':
      if (child) {
        return getChildInterests();
      }
      return teen ? getTeenInterests() : commonInterests;

    case 'daughter':
      if (child) {
        return getChildInterests();
      }
      return teen ? [
        { label: 'Fashion', icon: <ShoppingBag /> },
        { label: 'Art', icon: <Palette /> },
        ...commonInterests,
        { label: 'Dance', icon: <Heart /> },
        ...techInterests,
        { label: 'Sports', icon: <Trophy /> },
        { label: 'Beauty', icon: <Heart /> },
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
