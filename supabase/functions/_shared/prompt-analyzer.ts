export function analyzePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Split the prompt into words and clean them
  const words = lowerPrompt
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .split(' ')
    .map(word => word.trim())
    .filter(word => word.length > 0);

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

  // Detect numerical age - now including months
  const agePatterns = [
    // Years patterns
    /(\d+)(?:\s*-\s*\d+)?\s*years?\s*old/i,
    /age[sd]?\s*:?\s*(\d+)/i,
    /(\d+)\s*y\.?o\.?/i,
    // Months patterns
    /(\d+)\s*months?\s*old/i,
    /(\d+)\s*m\.?o\.?/i
  ];

  let numericalAge = null;
  let isMonths = false;
  
  for (const pattern of agePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      // Check if the matched pattern includes "month"
      if (pattern.toString().includes('month')) {
        isMonths = true;
        // Convert months to years (rounded to 2 decimal places)
        numericalAge = Math.round((value / 12) * 100) / 100;
      } else {
        numericalAge = value;
      }
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
  const determineAgeCategory = (age: number | null, wordCategory: string | null, monthsAge: boolean) => {
    // If age is in months or very young, prioritize infant category
    if (monthsAge || (age !== null && age <= 2)) {
      return 'infant';
    }
    
    if (age !== null) {
      if (age <= 12) return 'child';
      if (age <= 19) return 'teen';
      if (age <= 29) return 'youngAdult';
      if (age <= 64) return 'adult';
      if (age >= 65) return 'senior';  // More explicit senior age check
    }
    
    // If no numerical age but we have a word category, use that
    if (wordCategory) {
      return wordCategory;
    }
    
    // If no age information at all, return null
    return null;
  };

  const finalAgeCategory = determineAgeCategory(numericalAge, ageCategory, isMonths);

  return {
    hasAge: numericalAge !== null || ageCategory !== null,
    age: numericalAge,
    isAgeInMonths: isMonths,
    ageCategory: finalAgeCategory,
    originalAgeCategory: ageCategory // useful for debugging
  };
}