import { Person, AgeRange, PriceRange } from '@/types/gift-selector';

export const people: Person[] = [
  { label: 'Wife', icon: '❤️' },
  { label: 'Husband', icon: '💙' },
  { label: 'Father', icon: '👨' },
  { label: 'Mother', icon: '👩' },
  { label: 'Brother', icon: '👦' },
  { label: 'Sister', icon: '👧' },
  { label: 'Grandma', icon: '👵' },
  { label: 'Grandpa', icon: '👴' },
  { label: 'Son', icon: '👦' },
  { label: 'Daughter', icon: '👧' },
  { label: 'Boyfriend', icon: '💚' },
  { label: 'Girlfriend', icon: '💗' },
];

export const ageRanges: AgeRange[] = [
  { label: '0-4 Years', range: '0-4' },
  { label: '5-9 Years', range: '5-9' },
  { label: '10-14 Years', range: '10-14' },
  { label: '15-19 Years', range: '15-19' },
  { label: '20-30 Years', range: '20-30' },
  { label: '30-40 Years', range: '30-40' },
  { label: '40-50 Years', range: '40-50' },
  { label: '50-60 Years', range: '50-60' },
  { label: '60-80 Years', range: '60-80' },
  { label: '80+ Years', range: '80+' },
];

export const priceRanges: PriceRange[] = [
  { label: '5-20', range: '5-20' },
  { label: '20-40', range: '20-40' },
  { label: '40-60', range: '40-60' },
  { label: '60-100', range: '60-100' },
  { label: '100-200', range: '100-200' },
  { label: '200-400', range: '200-400' },
  { label: '400-800', range: '400-800' },
  { label: '800-1000', range: '800-1000' },
  { label: '1000-2000', range: '1000-2000' },
  { label: '2000-5000', range: '2000-5000' },
];
