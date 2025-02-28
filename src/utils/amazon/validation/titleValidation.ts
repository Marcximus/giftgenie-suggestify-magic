// Blacklisted terms that indicate irrelevant products
const BLACKLISTED_TERMS = [
  'cancel subscription',
  'cancel',
  'refund',
  'return policy',
  'warranty claim',
  'customer service',
  'guide',
  'manual',
  'handbook',
  'instruction',
  'tutorial',
  'how to',
  'replacement',
  'repair',
  'service plan',
  'protection plan',
  'extended warranty'
];

export const validateProductTitle = (title: string): boolean => {
  if (!title) {
    console.log('Missing title');
    return false;
  }

  const lowerTitle = title.toLowerCase();
  
  // Check for blacklisted terms
  for (const term of BLACKLISTED_TERMS) {
    if (lowerTitle.includes(term.toLowerCase())) {
      console.log('Title contains blacklisted term:', term);
      return false;
    }
  }

  return true;
};