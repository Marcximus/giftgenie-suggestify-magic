import { Interest } from '@/types/interests';
import { getPersonSpecificInterests } from '@/data/person-specific-interests';
import { getChildInterests, getTeenInterests } from '@/data/interests/age-specific';

export const getInterests = (person: string, ageRange: string): Interest[] => {
  // Handle children and teens first
  const isChild = ['0-2', '3-7', '8-12'].includes(ageRange);
  const isTeen = ['13-20'].includes(ageRange);

  if (isChild) return getChildInterests();
  if (isTeen) return getTeenInterests();

  // Return person-specific interests for adults
  return getPersonSpecificInterests(person);
};