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

  switch (person.toLowerCase()) {
    case 'wife':
    case 'girlfriend':
      return [
        ...romanticInterests,
        { label: 'Jewelry', icon: '💎' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Fashion', icon: '👗' },
        { label: 'Accessories', icon: '👜' },
        { label: 'Perfume', icon: '🌸' },
        { label: 'Yoga', icon: '🧘‍♀️' },
        { label: 'Dancing', icon: '💃' },
        { label: 'Photography', icon: '📸' },
        { label: 'Art', icon: '🎨' },
        { label: 'Reading', icon: '📚' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Wine', icon: '🍷' },
        { label: 'Plants', icon: '🪴' },
        { label: 'Music', icon: '🎵' }
      ];
    
    case 'husband':
    case 'boyfriend':
      return [
        ...romanticInterests,
        { label: 'Gaming', icon: '🎮' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Technology', icon: '📱' },
        { label: 'Gadgets', icon: '🔧' },
        { label: 'Grilling', icon: '🔥' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Watches', icon: '⌚' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Music', icon: '🎵' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Beer', icon: '🍺' },
        { label: 'Outdoors', icon: '🏕️' },
        { label: 'Photography', icon: '📸' },
        { label: 'Cars', icon: '🚗' },
        { label: 'DIY', icon: '🔨' }
      ];

    case 'father':
      return middleAged ? [
        { label: 'BBQ & Grilling', icon: '🔥' },
        { label: 'Tools & DIY', icon: '🔧' },
        { label: 'Gardening', icon: '🌱' },
        { label: 'Sports Fan', icon: '🏆' },
        { label: 'Golf', icon: '⛳' },
        { label: 'Fishing', icon: '🎣' },
        { label: 'Technology', icon: '📱' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Watches', icon: '⌚' },
        { label: 'Cars', icon: '🚗' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Music', icon: '🎵' },
        { label: 'Photography', icon: '📸' },
        { label: 'History', icon: '📚' },
        { label: 'Camping', icon: '🏕️' }
      ] : [
        { label: 'Sports', icon: '⚽' },
        { label: 'Gaming', icon: '🎮' },
        { label: 'Technology', icon: '📱' },
        { label: 'Music', icon: '🎵' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Photography', icon: '📸' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Outdoors', icon: '🏕️' },
        { label: 'Movies', icon: '🎬' },
        { label: 'Cooking', icon: '👨‍🍳' },
        { label: 'Reading', icon: '📚' }
      ];
    
    case 'mother':
      return middleAged ? [
        { label: 'Gardening', icon: '🌱' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Home Decor', icon: '🏠' },
        { label: 'Reading', icon: '📚' },
        { label: 'Crafts', icon: '🎨' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Jewelry', icon: '💎' },
        { label: 'Plants', icon: '🪴' },
        { label: 'Photography', icon: '📸' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Music', icon: '🎵' },
        { label: 'Wine', icon: '🍷' },
        { label: 'Yoga', icon: '🧘‍♀️' },
        { label: 'Fashion', icon: '👗' }
      ] : [
        { label: 'Fitness', icon: '🏃‍♀️' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Photography', icon: '📸' },
        { label: 'Music', icon: '🎵' },
        { label: 'Art', icon: '🎨' },
        { label: 'Fashion', icon: '👗' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Yoga', icon: '🧘‍♀️' },
        { label: 'Reading', icon: '📚' },
        { label: 'Plants', icon: '🪴' },
        { label: 'Movies', icon: '🎬' }
      ];
    
    case 'brother':
      if (child) return getChildInterests();
      if (teen) return getTeenInterests();
      return [
        { label: 'Gaming', icon: '🎮' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Technology', icon: '📱' },
        { label: 'Music', icon: '🎵' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Movies', icon: '🎬' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Photography', icon: '📸' },
        { label: 'Outdoors', icon: '🏕️' },
        { label: 'Cars', icon: '🚗' },
        { label: 'Skateboarding', icon: '🛹' },
        { label: 'Art', icon: '🎨' }
      ];
    
    case 'sister':
      if (child) return getChildInterests();
      if (teen) return getTeenInterests();
      return [
        { label: 'Fashion', icon: '👗' },
        { label: 'Music', icon: '🎵' },
        { label: 'Art', icon: '🎨' },
        { label: 'Photography', icon: '📸' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Yoga', icon: '🧘‍♀️' },
        { label: 'Dancing', icon: '💃' },
        { label: 'Reading', icon: '📚' },
        { label: 'Plants', icon: '🪴' },
        { label: 'Movies', icon: '🎬' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Fitness', icon: '🏃‍♀️' }
      ];
    
    case 'grandma':
      return [
        { label: 'Gardening', icon: '🌱' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Knitting', icon: '🧶' },
        { label: 'Reading', icon: '📚' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Crafts', icon: '🎨' },
        { label: 'Puzzles', icon: '🧩' },
        { label: 'Birds', icon: '🦜' },
        { label: 'Plants', icon: '🪴' },
        { label: 'Music', icon: '🎵' },
        { label: 'Photography', icon: '📸' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Movies', icon: '🎬' },
        { label: 'Baking', icon: '🍪' },
        { label: 'Family', icon: '👨‍👩‍👧‍👦' }
      ];
    
    case 'grandpa':
      return [
        { label: 'Gardening', icon: '🌱' },
        { label: 'Reading', icon: '📚' },
        { label: 'History', icon: '📖' },
        { label: 'Chess', icon: '♟️' },
        { label: 'Fishing', icon: '🎣' },
        { label: 'Birds', icon: '🦜' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Tools', icon: '🔧' },
        { label: 'Golf', icon: '⛳' },
        { label: 'Music', icon: '🎵' },
        { label: 'Photography', icon: '📸' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Movies', icon: '🎬' },
        { label: 'Woodworking', icon: '🪚' },
        { label: 'Family', icon: '👨‍👩‍👧‍👦' }
      ];

    case 'friend':
      return [
        { label: 'Gaming', icon: '🎮' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Music', icon: '🎵' },
        { label: 'Movies', icon: '🎬' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Food', icon: '🍕' },
        { label: 'Fitness', icon: '🏃' },
        { label: 'Photography', icon: '📸' },
        { label: 'Art', icon: '🎨' },
        { label: 'Books', icon: '📚' },
        { label: 'Technology', icon: '📱' }
      ];
    
    case 'colleague':
      return [
        { label: 'Coffee', icon: '☕' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Office', icon: '💼' },
        { label: 'Technology', icon: '💻' },
        { label: 'Books', icon: '📚' },
        { label: 'Wellness', icon: '🌿' },
        { label: 'Food', icon: '🍕' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Music', icon: '🎵' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Photography', icon: '📸' },
        { label: 'Movies', icon: '🎬' }
      ];
    
    default:
      return commonInterests;
  }
};