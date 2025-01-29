export const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    console.log('Parsing price range:', priceRange);
    
    // Remove currency symbols and clean up
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    
    // Handle hyphen-separated range (e.g., "20-50")
    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        console.log('Parsed range values:', { min, max });
        return { min, max };
      }
    }
    
    // Handle single number with 20% variance (e.g., "around 30")
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      const min = singlePrice * 0.8;
      const max = singlePrice * 1.2;
      console.log('Parsed single price with variance:', { min, max });
      return { min, max };
    }

    console.error('Failed to parse price range:', priceRange);
    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};

export const validatePriceInRange = (price: number, min: number, max: number): boolean => {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    console.log('Invalid price value:', price);
    return false;
  }

  const isInRange = price >= min && price <= max;
  console.log('Price validation:', { price, min, max, isInRange });
  return isInRange;
};

export const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  
  if (isNaN(price) || price <= 0) {
    console.log('Failed to extract valid price from:', priceStr);
    return undefined;
  }
  
  console.log('Extracted price:', price);
  return price;
};