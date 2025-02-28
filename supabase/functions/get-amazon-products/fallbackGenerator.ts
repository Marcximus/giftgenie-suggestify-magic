
import { FallbackTerm } from './types.ts';
import { getProductType, getBrandName, getMaterialOrAttribute } from './productClassification.ts';
import { cleanSearchTerm } from './searchUtils.ts';

export const generateFallbackTerms = (term: string): FallbackTerm[] => {
  const cleanedTerm = cleanSearchTerm(term);
  const productType = getProductType(cleanedTerm);
  const brand = getBrandName(cleanedTerm);
  const attribute = getMaterialOrAttribute(cleanedTerm);
  const fallbackTerms: FallbackTerm[] = [];
  
  // Split into words, but filter out short words (likely to be prepositions, articles, etc.)
  const words = cleanedTerm.split(' ').filter(word => word.length > 2);
  
  // Various combinations of words for fallbacks
  const firstTwoWords = words.slice(0, 2).join(' ');
  const firstThreeWords = words.slice(0, 3).join(' ');
  const firstFourWords = words.slice(0, 4).join(' ');
  
  // Create meaningful keyword combinations based on sentence structure
  // Extract key nouns (usually at the beginning and end of the search term)
  const keyNouns = words.length > 3 
    ? [words[0], words[words.length - 1]].join(' ') 
    : firstTwoWords;

  console.log('Generating fallback terms with:', {
    originalTerm: term,
    cleanedTerm,
    productType,
    brand,
    attribute,
    keyNouns,
    firstTwoWords,
    firstThreeWords,
    firstFourWords,
    totalWords: words.length
  });

  // First try: Original clean term WITH price constraints
  fallbackTerms.push({ 
    searchTerm: cleanedTerm,
    usePriceConstraints: true,
    priority: 0
  });

  // Second try: First 3-4 words WITH price constraints
  // This preserves specificity but removes potential noise at the end
  if (words.length > 3 && firstFourWords) {
    fallbackTerms.push({ 
      searchTerm: firstFourWords,
      usePriceConstraints: true,
      priority: 1
    });
  } else if (firstThreeWords) {
    fallbackTerms.push({ 
      searchTerm: firstThreeWords,
      usePriceConstraints: true,
      priority: 1
    });
  }

  // Third try: Brand + Product Type + Attribute WITH price constraints
  // This creates a highly specific and structured query
  if (brand && productType && attribute) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType} ${attribute}`,
      usePriceConstraints: true,
      priority: 2
    });
  }

  // Fourth try: Product Type + Attribute WITH price constraints
  // Good when brand is not important or possibly incorrect
  if (productType && attribute) {
    fallbackTerms.push({ 
      searchTerm: `${productType} ${attribute}`,
      usePriceConstraints: true,
      priority: 3
    });
  }

  // Fifth try: Key nouns WITH price constraints
  // This focuses on the most significant words that best describe the product
  if (keyNouns && keyNouns !== firstTwoWords) {
    fallbackTerms.push({ 
      searchTerm: keyNouns,
      usePriceConstraints: true,
      priority: 4
    });
  }

  // Sixth try: Brand + Product Type WITH price constraints
  if (brand && productType) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType}`,
      usePriceConstraints: true,
      priority: 5
    });
  }

  // Seventh try: First two words WITH price constraints
  // Very simplified but might catch essential product type
  if (firstTwoWords) {
    fallbackTerms.push({ 
      searchTerm: firstTwoWords,
      usePriceConstraints: true,
      priority: 6
    });
  }

  // Eighth try: Product type WITH price constraints
  // Most generic fallback, but still using price constraints
  if (productType) {
    fallbackTerms.push({ 
      searchTerm: productType,
      usePriceConstraints: true,
      priority: 7
    });
  }

  // Ninth try: Original term WITHOUT price constraints
  // If all else fails, try without price constraints
  fallbackTerms.push({ 
    searchTerm: cleanedTerm,
    usePriceConstraints: false,
    priority: 8
  });

  // Tenth try: Brand + Product Type WITHOUT price constraints
  // More generic search when price might be the blocking factor
  if (brand && productType) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType}`,
      usePriceConstraints: false,
      priority: 9
    });
  }

  // Remove duplicate fallback terms (same search term and price constraint setting)
  const uniqueFallbacks: FallbackTerm[] = [];
  const seenTerms = new Set<string>();
  
  for (const fallback of fallbackTerms) {
    const key = `${fallback.searchTerm}|${fallback.usePriceConstraints}`;
    if (!seenTerms.has(key)) {
      seenTerms.add(key);
      uniqueFallbacks.push(fallback);
    }
  }
  
  // Sort fallback terms by priority
  uniqueFallbacks.sort((a, b) => a.priority - b.priority);

  console.log('Generated fallback terms:', uniqueFallbacks);

  return uniqueFallbacks;
};
