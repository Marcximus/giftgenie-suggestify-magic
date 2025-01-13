export const detectGender = (searchTerm: string): string | null => {
  const maleTerms = ['brother', 'father', 'husband', 'boyfriend', 'son', 'grandpa', 'uncle', 'dad', 'male'];
  const femaleTerms = ['sister', 'mother', 'wife', 'girlfriend', 'daughter', 'grandma', 'aunt', 'mom', 'female'];
  
  const lowerTerm = searchTerm.toLowerCase();
  
  if (maleTerms.some(term => lowerTerm.includes(term))) return 'male';
  if (femaleTerms.some(term => lowerTerm.includes(term))) return 'female';
  
  return null;
};

export const detectAgeGroup = (searchTerm: string): string => {
  const lowerTerm = searchTerm.toLowerCase();
  
  if (lowerTerm.includes('baby') || lowerTerm.includes('infant') || /\b[0-2]\s*(?:year|month)/.test(lowerTerm)) {
    return 'infant';
  }
  if (lowerTerm.includes('kid') || /\b[3-12]\s*year/.test(lowerTerm)) {
    return 'child';
  }
  if (lowerTerm.includes('teen') || /\b1[3-9]\s*year/.test(lowerTerm)) {
    return 'teen';
  }
  if (/\b(?:2[0-9]|30)\s*year/.test(lowerTerm)) {
    return 'youngAdult';
  }
  if (/\b(?:3[1-9]|[4-5][0-9]|60)\s*year/.test(lowerTerm)) {
    return 'adult';
  }
  if (/\b(?:6[1-9]|[7-9][0-9])\s*year/.test(lowerTerm) || lowerTerm.includes('senior')) {
    return 'senior';
  }
  
  return 'adult'; // default age group
};