import { Person, AgeRange, PriceRange } from '@/types/gift-selector';
import { Smile, Heart, Frown, ThumbsUp, ThumbsDown } from 'lucide-react';

export const people: Person[] = [
  { label: 'Wife', icon: <Heart /> },
  { label: 'Husband', icon: <Heart /> },
  { label: 'Father', icon: <Smile /> },
  { label: 'Mother', icon: <Smile /> },
  { label: 'Brother', icon: <ThumbsUp /> },
  { label: 'Sister', icon: <ThumbsUp /> },
  { label: 'Grandma', icon: <Heart /> },
  { label: 'Grandpa', icon: <Heart /> },
  { label: 'Son', icon: <Smile /> },
  { label: 'Daughter', icon: <Smile /> },
  { label: 'Boyfriend', icon: <Heart /> },
  { label: 'Girlfriend', icon: <Heart /> },
  { label: 'Colleague', icon: <ThumbsUp /> },
];

export const ageRanges: AgeRange[] = [
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

export const priceRanges: PriceRange[] = [
  { label: '5-20', range: '5-20' },
  { label: '20-40', range: '20-40' },
  { label: '40-60', range: '40-60' },
  { label: '60-100', range: '60-100' },
  { label: '100-200', range: '100-200' },
  { label: '200-400', range: '200-400' },
  { label: '400-800', range: '400-800' },
  { label: '800+', range: '800+' },
];
