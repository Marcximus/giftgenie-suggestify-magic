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
  
  return {
    hasGender: isMale || isFemale,
    hasAge: /\d+/.test(prompt),
    hasInterests: lowerPrompt.includes('likes') || lowerPrompt.includes('loves') || 
                  lowerPrompt.includes('enjoys') || lowerPrompt.includes('interested'),
    isMale,
    isFemale,
    hasEverything: lowerPrompt.includes('has everything') || 
                   lowerPrompt.includes('hard to shop for') || 
                   lowerPrompt.includes('difficult to buy for'),
    budgetMatch: prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i)
  };
}