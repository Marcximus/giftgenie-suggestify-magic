export const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    console.log('Starting price range parsing:', priceRange);
    
    // Remove currency symbols and clean up
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    console.log('Cleaned price range:', cleanRange);
    
    // Handle hyphen-separated range (e.g., "20-50")
    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(Number);
      console.log('Split range values:', { min, max });
      
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        // Use exact values for API parameters
        console.log('Successfully parsed range:', { min, max });
        return { min, max };
      }
    }
    
    // Handle single number (e.g., "around 30")
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      // Use exact value for single price - no variance
      console.log('Using exact single price:', singlePrice);
      return { min: singlePrice, max: singlePrice };
    }

    console.error('Failed to parse price range:', { input: priceRange, cleaned: cleanRange });
    return null;
  } catch (error) {
    console.error('Error parsing price range:', { input: priceRange, error });
    return null;
  }
};

export const validatePriceInRange = (price: number, min: number, max: number): boolean => {
  console.log('Validating price:', { price, min, max });
  
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    console.log('Invalid price value:', price);
    return false;
  }

  // Strict validation - must be within exact range
  const isInRange = price >= min && price <= max;
  console.log('Price validation result:', { price, min, max, isInRange });
  return isInRange;
};

export const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  console.log('Extracting price from:', priceStr);
  
  if (!priceStr) {
    console.log('No price string provided');
    return undefined;
  }
  
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  console.log('Cleaned price string:', cleanPrice);
  
  const price = parseFloat(cleanPrice);
  
  if (isNaN(price) || price <= 0) {
    console.log('Failed to extract valid price:', { input: priceStr, cleaned: cleanPrice });
    return undefined;
  }
  
  console.log('Successfully extracted price:', price);
  return price;
};