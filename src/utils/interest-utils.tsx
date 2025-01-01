import { Interest } from '@/types/gift-selector';
import { commonInterests } from '@/data/common-interests';
import { techInterests } from '@/data/tech-interests';
import { lifestyleInterests } from '@/data/lifestyle-interests';
import { homeInterests } from '@/data/home-interests';
import { getChildInterests } from '@/data/child-interests';
import { getTeenInterests } from '@/data/teen-interests';
import { romanticInterests } from '@/data/romantic-interests';
import { creativeInterests } from '@/data/creative-interests';

export const getInterests = (person: string, ageRange: string): Interest[] => {
  const youngAdult = ['20-30', '30-40'].includes(ageRange);
  const middleAged = ['40-50', '50-60'].includes(ageRange);
  const senior = ['60-80', '80+'].includes(ageRange);
  const child = ['0-4', '5-9', '10-14'].includes(ageRange);
  const teen = ['15-19'].includes(ageRange);

  // Base interests that are generally appropriate for most people
  const baseInterests = [
    { label: 'Reading', icon: '📚' },
    { label: 'Music', icon: '🎵' },
    { label: 'Sports', icon: '⚽' },
    { label: 'Movies', icon: '🎬' },
    { label: 'Travel', icon: '✈️' }
  ];

  switch (person.toLowerCase()) {
    case 'wife':
    case 'girlfriend':
      return [
        ...romanticInterests,
        ...lifestyleInterests,
        { label: 'Jewelry', icon: '💎' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Fashion', icon: '👗' },
        ...homeInterests.slice(0, 3),
        ...creativeInterests.slice(0, 3)
      ];
    
    case 'husband':
    case 'boyfriend':
      return [
        ...romanticInterests,
        ...techInterests.slice(0, 4),
        { label: 'Grilling', icon: '🔥' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Sports Fan', icon: '🏆' },
        { label: 'Watches', icon: '⌚' },
        { label: 'Tools', icon: '🔧' },
        { label: 'Outdoors', icon: '🏕️' }
      ];

    case 'father':
      return middleAged ? [
        { label: 'BBQ & Grilling', icon: '🔥' },
        { label: 'Tools & DIY', icon: '🔧' },
        { label: 'Gardening', icon: '🌱' },
        { label: 'Sports Fan', icon: '🏆' },
        { label: 'Golf', icon: '⛳' },
        { label: 'Fishing', icon: '🎣' },
        ...techInterests.slice(0, 3),
        { label: 'Coffee', icon: '☕' }
      ] : [
        ...baseInterests,
        { label: 'Tools', icon: '🔧' },
        { label: 'Outdoors', icon: '🏕️' },
        { label: 'Cooking', icon: '👨‍🍳' }
      ];
    
    case 'mother':
      return middleAged ? [
        ...homeInterests.slice(0, 4),
        { label: 'Gardening', icon: '🌱' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Jewelry', icon: '💎' },
        ...creativeInterests.slice(0, 3)
      ] : [
        ...baseInterests,
        ...homeInterests.slice(0, 3),
        { label: 'Self-care', icon: '🛁' }
      ];
    
    case 'brother':
      return youngAdult ? [
        ...techInterests.slice(0, 4),
        { label: 'Gaming', icon: '🎮' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Music', icon: '🎵' },
        { label: 'Outdoors', icon: '🏕️' }
      ] : teen ? getTeenInterests() : getChildInterests();
    
    case 'sister':
      return youngAdult ? [
        { label: 'Fashion', icon: '👗' },
        { label: 'Jewelry', icon: '💎' },
        { label: 'Fitness', icon: '🧘‍♀️' },
        { label: 'Photography', icon: '📸' },
        ...creativeInterests.slice(0, 3),
        ...lifestyleInterests.slice(0, 3)
      ] : teen ? getTeenInterests() : getChildInterests();
    
    case 'grandma':
      return [
        { label: 'Gardening', icon: '🌱' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Knitting', icon: '🧶' },
        { label: 'Reading', icon: '📚' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Family Photos', icon: '🖼️' },
        { label: 'Puzzles', icon: '🧩' },
        { label: 'Birds & Nature', icon: '🦜' }
      ];
    
    case 'grandpa':
      return [
        { label: 'Gardening', icon: '🌱' },
        { label: 'Reading', icon: '📚' },
        { label: 'History', icon: '📖' },
        { label: 'Chess', icon: '♟️' },
        { label: 'Fishing', icon: '🎣' },
        { label: 'Birds & Nature', icon: '🦜' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Tools', icon: '🔧' }
      ];

    case 'son':
      if (child) return getChildInterests();
      if (teen) return getTeenInterests();
      return [
        { label: 'Gaming', icon: '🎮' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Music', icon: '🎵' },
        ...techInterests.slice(0, 3),
        { label: 'Fitness', icon: '💪' },
        { label: 'Outdoors', icon: '🏕️' }
      ];

    case 'daughter':
      if (child) return getChildInterests();
      if (teen) return getTeenInterests();
      return [
        { label: 'Fashion', icon: '👗' },
        { label: 'Art', icon: '🎨' },
        { label: 'Music', icon: '🎵' },
        { label: 'Dance', icon: '💃' },
        { label: 'Photography', icon: '📸' },
        ...lifestyleInterests.slice(0, 3)
      ];
    
    case 'friend':
      return [
        ...baseInterests,
        { label: 'Gaming', icon: '🎮' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Food', icon: '🍕' },
        { label: 'Fitness', icon: '🏃' }
      ];
    
    case 'colleague':
      return [
        { label: 'Coffee', icon: '☕' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Office', icon: '💼' },
        { label: 'Tech', icon: '💻' },
        { label: 'Books', icon: '📚' },
        { label: 'Wellness', icon: '🌿' }
      ];
    
    default:
      return baseInterests;
  }
};