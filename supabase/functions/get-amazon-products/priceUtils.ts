export const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove currency symbols and clean the string
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    
    // Handle hyphen-separated range (e.g., "20-50")
    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        return { min, max };
      }
    }
    
    // Handle single number (e.g., "around 30")
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      // Use 20% variance for single prices
      return {
        min: Math.max(1, singlePrice * 0.8),
        max: singlePrice * 1.2
      };
    }

    console.log('Invalid price range format:', priceRange);
    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};

export const applyPriceTolerance = (range: { min: number; max: number }): { min: number; max: number } => {
  return {
    min: Math.max(1, Math.floor(range.min * 0.8)), // Never go below $1
    max: Math.ceil(range.max * 1.2)
  };
};

export const validatePriceInRange = (price: number, min: number, max: number): boolean => {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    console.log('Invalid price:', price);
    return false;
  }

  const isInRange = price >= min && price <= max;
  if (!isInRange) {
    console.log('Price out of range:', { price, min, max });
  }
  return isInRange;
};

export const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  
  // Remove currency symbols and clean the string
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  
  if (isNaN(price) || price <= 0) {
    console.log('Invalid price format:', priceStr);
    return undefined;
  }
  
  return price;
};