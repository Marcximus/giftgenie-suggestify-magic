import { FallbackTerm } from './types.ts';
import { getProductType, getBrandName, getMaterialOrAttribute } from './productClassification.ts';
import { cleanSearchTerm } from './searchUtils.ts';

export const generateFallbackTerms = (term: string): FallbackTerm[] => {
  const productType = getProductType(term);
  const brand = getBrandName(term);
  const attribute = getMaterialOrAttribute(term);
  const fallbackTerms: FallbackTerm[] = [];
  const words = term.split(' ').filter(word => word.length > 2);
  const firstThreeWords = words.slice(0, 3).join(' ');
  const firstFourWords = words.slice(0, 4).join(' ');

  console.log('Generating fallback terms with:', {
    originalTerm: term,
    productType,
    brand,
    attribute,
    firstThreeWords,
    firstFourWords
  });

  // First fallback: First 3 words WITH price constraints
  if (firstThreeWords) {
    fallbackTerms.push({ 
      searchTerm: firstThreeWords,
      usePriceConstraints: true,
      priority: 1
    });
  }

  // Second fallback: First 3 words WITHOUT price constraints
  if (firstThreeWords) {
    fallbackTerms.push({ 
      searchTerm: firstThreeWords,
      usePriceConstraints: false,
      priority: 2
    });
  }

  // Third fallback: Brand + Product Type + Attribute WITHOUT price constraints
  if (brand && productType && attribute) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType} ${attribute}`,
      usePriceConstraints: false,
      priority: 3
    });
  }

  // Fourth fallback: Brand + Product Type WITH price constraints
  if (brand && productType) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType}`,
      usePriceConstraints: true,
      priority: 4
    });
  }

  // Fifth fallback: Brand + Product Type WITHOUT price constraints
  if (brand && productType) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType}`,
      usePriceConstraints: false,
      priority: 5
    });
  }

  // Sixth fallback: First 4 words WITH price constraints
  if (firstFourWords) {
    fallbackTerms.push({ 
      searchTerm: firstFourWords,
      usePriceConstraints: true,
      priority: 6
    });
  }

  // Sort fallback terms by priority
  fallbackTerms.sort((a, b) => a.priority - b.priority);

  console.log('Generated fallback terms:', fallbackTerms);

  return fallbackTerms;
};