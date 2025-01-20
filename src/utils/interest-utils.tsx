import { Interest } from '@/types/interests';
import { babyInterests } from '@/data/interests/baby-interests';
import { youngChildInterests } from '@/data/interests/young-child-interests';
import { 
  wifeInterests,
  husbandInterests,
  fatherInterests,
  motherInterests
} from '@/data/interests/family-interests';
import {
  brotherInterests,
  sisterInterests
} from '@/data/interests/siblings-interests';
import {
  grandmaInterests,
  grandpaInterests
} from '@/data/interests/grandparents-interests';
import {
  sonInterests,
  daughterInterests
} from '@/data/interests/children-interests';
import {
  boyfriendInterests,
  girlfriendInterests
} from '@/data/interests/romantic-interests';

export const getInterests = (person: string, ageRange: string): Interest[] => {
  // Handle babies and young children first
  if (['0-2'].includes(ageRange)) return babyInterests;
  if (['3-7'].includes(ageRange)) return youngChildInterests;

  // Return person-specific interests for everyone else
  switch (person.toLowerCase()) {
    case 'wife':
      return wifeInterests;
    case 'husband':
      return husbandInterests;
    case 'father':
      return fatherInterests;
    case 'mother':
      return motherInterests;
    case 'brother':
      return brotherInterests;
    case 'sister':
      return sisterInterests;
    case 'grandma':
      return grandmaInterests;
    case 'grandpa':
      return grandpaInterests;
    case 'son':
      return sonInterests;
    case 'daughter':
      return daughterInterests;
    case 'boyfriend':
      return boyfriendInterests;
    case 'girlfriend':
      return girlfriendInterests;
    default:
      return [];
  }
};