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
        ...lifestyleInterests,
        ...homeInterests,
        ...creativeInterests,
        ...commonInterests,
      ];
    
    case 'husband':
    case 'boyfriend':
      return [
        ...romanticInterests,
        ...techInterests,
        ...commonInterests,
        ...homeInterests,
        ...(youngAdult ? lifestyleInterests : []),
      ];

    case 'father':
      return youngAdult ? [
        ...techInterests,
        ...homeInterests,
        ...commonInterests,
        ...creativeInterests,
      ] : [
        ...homeInterests,
        ...commonInterests,
        ...techInterests,
      ];
    
    case 'mother':
      return middleAged ? [
        ...homeInterests,
        ...lifestyleInterests,
        ...commonInterests,
        ...creativeInterests,
      ] : [
        ...lifestyleInterests,
        ...commonInterests,
        ...homeInterests,
      ];
    
    case 'sister':
      return youngAdult ? [
        ...lifestyleInterests,
        ...techInterests,
        ...commonInterests,
        ...creativeInterests,
      ] : [
        ...lifestyleInterests,
        ...commonInterests,
        ...creativeInterests,
      ];
    
    case 'brother':
      return youngAdult ? [
        ...techInterests,
        ...lifestyleInterests,
        ...commonInterests,
        ...creativeInterests,
      ] : [
        ...techInterests,
        ...commonInterests,
        ...creativeInterests,
      ];
    
    case 'grandma':
      return [
        ...homeInterests,
        ...creativeInterests,
        ...commonInterests.filter(interest => 
          ['Reading', 'Art', 'Music'].includes(interest.label)
        ),
      ];
    
    case 'grandpa':
      return [
        ...homeInterests,
        ...commonInterests.filter(interest => 
          ['Reading', 'Sports', 'Music'].includes(interest.label)
        ),
        ...techInterests.filter(interest =>
          ['Technology', 'Gadgets'].includes(interest.label)
        ),
      ];

    case 'son':
      if (child) return getChildInterests();
      return teen ? getTeenInterests() : [
        ...techInterests,
        ...commonInterests,
        ...creativeInterests,
      ];

    case 'daughter':
      if (child) return getChildInterests();
      return teen ? [
        ...lifestyleInterests,
        ...techInterests,
        ...commonInterests,
        ...creativeInterests,
      ] : commonInterests;
    
    case 'friend':
      return youngAdult ? [
        ...commonInterests,
        ...techInterests,
        ...lifestyleInterests,
        ...creativeInterests,
      ] : [
        ...commonInterests,
        ...homeInterests,
        ...creativeInterests,
      ];
    
    case 'colleague':
      return [
        ...commonInterests.filter(interest => 
          ['Reading', 'Art', 'Coffee', 'Wine'].includes(interest.label)
        ),
        ...homeInterests.filter(interest => 
          ['Home Decor', 'Kitchen Gadgets'].includes(interest.label)
        ),
        ...techInterests.filter(interest =>
          ['Technology', 'Gadgets'].includes(interest.label)
        ),
      ];
    
    default:
      return commonInterests;
  }
};