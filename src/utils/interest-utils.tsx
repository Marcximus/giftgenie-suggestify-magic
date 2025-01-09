import { Interest } from '@/types/interests';
import { lifestyleInterests } from '@/data/interests/lifestyle';
import { techInterests } from '@/data/interests/tech';
import { creativeInterests } from '@/data/interests/creative';
import { homeInterests } from '@/data/interests/home';
import { getChildInterests, getTeenInterests } from '@/data/interests/age-specific';

const commonInterests: Interest[] = [
  { label: 'Reading', icon: '📚' },
  { label: 'Music', icon: '🎵' },
  { label: 'Movies', icon: '🎬' },
  { label: 'Travel', icon: '✈️' },
  { label: 'Sports', icon: '⚽' },
  { label: 'Photography', icon: '📸' },
  { label: 'Coffee', icon: '☕' },
  { label: 'Food', icon: '🍕' }
];

const romanticInterests: Interest[] = [
  { label: 'Anniversary', icon: '💑' },
  { label: "Valentine's Day", icon: '💝' }
];

export const getInterests = (person: string, ageRange: string): Interest[] => {
  const youngAdult = ['20-30', '30-40'].includes(ageRange);
  const middleAged = ['40-50', '50-60'].includes(ageRange);
  const child = ['0-4', '5-9', '10-14'].includes(ageRange);
  const teen = ['15-19'].includes(ageRange);

  if (child) return getChildInterests();
  if (teen) return getTeenInterests();

  switch (person.toLowerCase()) {
    case 'wife':
    case 'girlfriend':
      return [...romanticInterests, ...lifestyleInterests, ...creativeInterests];
    
    case 'husband':
    case 'boyfriend':
      return [...romanticInterests, ...techInterests, ...homeInterests];
    
    case 'father':
      return middleAged ? 
        [...homeInterests, ...techInterests] :
        [...techInterests, ...commonInterests];
    
    case 'mother':
      return middleAged ?
        [...homeInterests, ...creativeInterests] :
        [...lifestyleInterests, ...commonInterests];
    
    case 'brother':
    case 'sister':
      return [...commonInterests, ...techInterests];
    
    case 'grandma':
    case 'grandpa':
      return [...homeInterests, ...commonInterests];
    
    case 'friend':
    case 'colleague':
      return commonInterests;
    
    default:
      return commonInterests;
  }
};