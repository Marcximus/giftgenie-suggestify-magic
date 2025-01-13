export function analyzePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  const maleKeywords = [
    'man', 'boy', 'father', 'husband', 'boyfriend', 'brother', 'grandpa', 'uncle',
    'mr', 'sir', 'he', 'him', 'his', 'himself',
    'son', 'nephew', 'king', 'prince', 'duke', 'lord', 'gentleman',
    'coach', 'captain', 'ceo', 'father-in-law', 'grandfather',
    'guy', 'dude', 'fella', 'bloke', 'mate',
    'fiance', 'beau', 'bachelor', 'male', 'mister', 'gent'
  ];

  const femaleKeywords = [
    'woman', 'girl', 'mother', 'wife', 'girlfriend', 'sister', 'grandma', 'aunt',
    'mrs', 'ms', 'miss', 'madam', "ma'am", 'she', 'her', 'herself',
    'daughter', 'niece', 'queen', 'princess', 'duchess', 'lady',
    'mother-in-law', 'grandmother',
    'gal', 'chick', 'fiancee', 'mistress', 'dame', 'female'
  ];

  const ageDescriptors = {
    infant: [
      'baby', 'infant', 'newborn', 'nursery', 'crib', 'diaper', 'pacifier',
      'stroller', 'teething', 'crawling', 'toddling'
    ],
    child: [
      'young child', 'kid', 'child', 'preteen', 'tween', 'elementary-aged',
      'playtime', 'school-aged', 'toys', 'backpack', 'school supplies',
      'storytime', 'playground', 'bus stop', 'kindergarten', 'grade school',
      'childhood', 'nursery', 'school', 'toddler'
    ],
    teen: [
      'teenager', 'teen', 'adolescent', 'high schooler', 'young teen',
      'pubescent', 'youth', 'minor', 'juvenile', 'middle schooler',
      'teen spirit', 'prom', 'homecoming', 'student council', 'slumber party',
      'teen idol', 'graduation', 'locker', 'gamer', 'influencer', 'high-school'
    ],
    youngAdult: [
      'young adult', 'twentysomething', 'early adult', 'emerging adult',
      'college-aged', 'millennial', 'gen z', 'post-graduate', 'recent graduate',
      'entry-level', 'dating', 'career start', 'first apartment', 'roommate',
      'young professional', 'urban living', 'gym', 'social', 'hobbies', 'college'
    ],
    adult: [
      'adult', 'middle-aged', 'mature adult', 'established', 'gen x', 'gen y',
      'professional', 'prime of life', 'adulthood', 'midlife', 'parenthood',
      'career', 'homeownership', 'stability', 'family', 'career focus',
      'management', 'executive', 'mentor', 'community', 'home', 'investment',
      'health'
    ],
    senior: [
      'senior', 'elderly', 'older', 'senior citizen', 'golden ager', 'retiree',
      'silver aged', 'senior years', 'veteran', 'aged', 'senior member',
      'geriatric', 'super senior', 'elder', 'retirement', 'pensioner',
      'grandparent', 'walking cane', 'hearing aid', 'nursing home',
      'retirement community', 'senior center', 'active aging', 'age-related'
    ]
  };

  // Split the prompt into words and clean them
  const words = lowerPrompt
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .split(' ')
    .map(word => word.trim())
    .filter(word => word.length > 0);

  // Check for male indicators
  const isMale = maleKeywords.some(keyword => 
    words.includes(keyword) || 
    lowerPrompt.includes(keyword)
  );

  // Check for female indicators
  const isFemale = femaleKeywords.some(keyword => 
    words.includes(keyword) || 
    lowerPrompt.includes(keyword)
  );

  // Detect numerical age
  const agePatterns = [
    /(\d+)(?:\s*-\s*\d+)?\s*years?\s*old/i,
    /age[sd]?\s*:?\s*(\d+)/i,
    /(\d+)\s*y\.?o\.?/i
  ];

  let numericalAge = null;
  for (const pattern of agePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      numericalAge = parseInt(match[1]);
      break;
    }
  }

  // Detect age category from descriptive words
  let ageCategory = null;
  for (const [category, descriptors] of Object.entries(ageDescriptors)) {
    if (descriptors.some(descriptor => 
      words.includes(descriptor) || 
      lowerPrompt.includes(descriptor)
    )) {
      ageCategory = category;
      break;
    }
  }

  // Determine final age category based on both numerical age and descriptive words
  const determineAgeCategory = (age: number | null, wordCategory: string | null) => {
    if (age !== null) {
      if (age <= 2) return 'infant';
      if (age <= 12) return 'child';
      if (age <= 19) return 'teen';
      if (age <= 29) return 'youngAdult';
      if (age <= 64) return 'adult';
      return 'senior';
    }
    return wordCategory;
  };

  const finalAgeCategory = determineAgeCategory(numericalAge, ageCategory);

  return {
    hasGender: isMale || isFemale,
    hasAge: numericalAge !== null || ageCategory !== null,
    isMale,
    isFemale,
    age: numericalAge,
    ageCategory: finalAgeCategory,
    hasEverything: lowerPrompt.includes('has everything') || 
                   lowerPrompt.includes('hard to shop for') || 
                   lowerPrompt.includes('difficult to buy for'),
    budgetMatch: prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i)
  };
}