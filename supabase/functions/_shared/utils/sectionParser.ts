import { ProductSection } from '../types/ContentTypes.ts';

export const parseProductSection = (section: string): ProductSection | null => {
  const h3Match = section.match(/<h3>([^<]+)<\/h3>/);
  
  if (!h3Match) {
    console.log('No product title found in section, keeping as is');
    return null;
  }
  
  const [fullMatch, productName] = h3Match;
  const [beforeH3, afterH3] = section.split(fullMatch);

  if (!beforeH3 || !afterH3) {
    console.warn('Could not split section content properly');
    return null;
  }

  return {
    beforeH3: beforeH3,
    afterH3: afterH3,
    productName: productName.trim()
  };
};