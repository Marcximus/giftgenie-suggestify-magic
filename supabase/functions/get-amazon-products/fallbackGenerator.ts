import { FallbackTerm } from './types.ts';
import { getProductType, getBrandName, getMaterialOrAttribute } from './productClassification.ts';
import { cleanSearchTerm } from './searchUtils.ts';

export const generateFallbackTerms = (term: string): FallbackTerm[] => {
  const productType = getProductType(term);
  const brand = getBrandName(term);
  const attribute = getMaterialOrAttribute(term);
  const fallbackTerms: FallbackTerm[] = [];

  if (!productType) {
    return [{ searchTerm: cleanSearchTerm(term), usePriceConstraints: true }];
  }

  // First fallback: Brand + Product Type + Attribute (WITH price constraints)
  if (brand && attribute) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType} ${attribute}`,
      usePriceConstraints: true 
    });
  }

  // Second fallback: Brand + Product Type + Attribute (WITHOUT price constraints)
  if (brand && attribute) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType} ${attribute}`,
      usePriceConstraints: false 
    });
  }

  // Third fallback: Brand + Product Type (WITHOUT price constraints)
  if (brand) {
    fallbackTerms.push({ 
      searchTerm: `${brand} ${productType}`,
      usePriceConstraints: false 
    });
  }

  // Fourth fallback: Product Type + Attribute (WITH price constraints)
  if (attribute) {
    fallbackTerms.push({ 
      searchTerm: `${attribute} ${productType}`,
      usePriceConstraints: true 
    });
  }

  console.log('Generated fallback terms:', {
    originalTerm: term,
    productType,
    brand,
    attribute,
    fallbackTerms
  });

  return fallbackTerms;
};