import { Interest } from '@/types/gift-selector';
import { CookingPot, Home, Leaf } from 'lucide-react';

export const homeInterests: Interest[] = [
  { label: 'Cooking', icon: <CookingPot /> },
  { label: 'Home Decor', icon: <Home /> },
  { label: 'Gardening', icon: <Leaf /> },
];