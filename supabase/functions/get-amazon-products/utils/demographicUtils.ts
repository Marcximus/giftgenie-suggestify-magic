export const detectGender = (searchTerm: string): string | null => {
  const maleTerms = ['male', 'man', 'boy', 'husband', 'boyfriend', 'father', 'dad', 'brother', 'uncle', 'grandfather', 'grandpa', 'his'];
  const femaleTerms = ['female', 'woman', 'girl', 'wife', 'girlfriend', 'mother', 'mom', 'sister', 'aunt', 'grandmother', 'grandma', 'her'];
  
  const words = searchTerm.toLowerCase().split(/\s+/);
  if (maleTerms.some(term => words.includes(term))) return 'male';
  if (femaleTerms.some(term => words.includes(term))) return 'female';
  return null;
};

export const detectAgeGroup = (searchTerm: string): string => {
  if (searchTerm.match(/\b(?:0|1|2|3|4|5|6|7|8|9|10|11|12)\s*months?\s*old\b/)) {
    return 'infant';
  }

  const ageMatch = searchTerm.match(/\b(\d+)(?:\s*-\s*\d+)?\s*years?\s*old\b/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    
    if (age <= 2) return 'infant';
    if (age <= 7) return 'child';
    if (age <= 12) return 'preteen';
    if (age <= 20) return 'teen';
    if (age <= 30) return 'youngAdult';
    if (age <= 64) return 'adult';
    return 'senior';
  }

  if (searchTerm.includes('baby') || searchTerm.includes('infant') || searchTerm.includes('toddler')) {
    return 'infant';
  }
  if (searchTerm.match(/\b(?:kid|child|elementary)\b/)) {
    return 'child';
  }
  if (searchTerm.match(/\b(?:tween|preteen)\b/)) {
    return 'preteen';
  }
  if (searchTerm.match(/\b(?:teen|teenager|adolescent)\b/)) {
    return 'teen';
  }
  if (searchTerm.match(/\b(?:college|university|young\s*adult|twenties)\b/)) {
    return 'youngAdult';
  }
  if (searchTerm.match(/\b(?:senior|elderly|retired|retirement)\b/)) {
    return 'senior';
  }

  return 'adult';
};

export const getCategoryId = (ageGroup: string): string => {
  return ageGroup === 'infant' ? 'baby-products' :
         ageGroup === 'child' ? 'toys-games' :
         ageGroup === 'preteen' ? 'toys-games' :
         ageGroup === 'teen' ? 'teen-gaming' :
         ageGroup === 'youngAdult' ? 'young-adult' :
         ageGroup === 'senior' ? 'health-personal-care' : 'aps';
};