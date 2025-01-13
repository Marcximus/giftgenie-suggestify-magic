import { detectGender, detectAgeGroup } from './demographicUtils.ts';

export const getFallbackSearchTerms = (searchTerm: string, ageCategory?: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const gender = detectGender(searchTerm);
  const ageGroup = ageCategory || detectAgeGroup(searchTerm);
  const searchTerms = [];
  
  const genderPrefix = gender === 'male' ? 'mens ' : gender === 'female' ? 'womens ' : '';
  const agePrefix = ageGroup === 'infant' ? 'baby ' :
                   ageGroup === 'child' ? 'kids ' :
                   ageGroup === 'preteen' ? 'tween ' :
                   ageGroup === 'teen' ? 'teen ' :
                   ageGroup === 'youngAdult' ? 'young adult ' :
                   ageGroup === 'senior' ? 'senior ' : '';
  
  if (words.length > 2) {
    searchTerms.push(genderPrefix + agePrefix + words.slice(0, 3).join(' '));
    searchTerms.push(genderPrefix + agePrefix + words.slice(-3).join(' '));
    searchTerms.push(genderPrefix + agePrefix + [words[0], words[words.length - 1]].join(' '));
  }
  
  const interests = ['gaming', 'sports', 'music', 'art', 'technology', 'reading', 'crafts', 'cooking'];
  const interestWord = words.find(word => interests.includes(word.toLowerCase()));
  if (interestWord) {
    searchTerms.push(genderPrefix + agePrefix + interestWord);
  }
  
  const randomIndex = Math.floor(Math.random() * words.length);
  searchTerms.push(genderPrefix + agePrefix + words[randomIndex]);
  
  return [...new Set(searchTerms)];
};