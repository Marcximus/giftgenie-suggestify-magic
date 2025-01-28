export const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove currency symbol and any whitespace
    const cleanRange = priceRange.replace(/[^0-9-]/g, '');
    
    if (cleanRange.includes('-')) {
      // Handle range (e.g., "20-40")
      const [min, max] = cleanRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        return { min, max };
      }
    } else {
      // Handle single number with 20% tolerance
      const value = Number(cleanRange);
      if (!isNaN(value) && value > 0) {
        return {
          min: value * 0.8,
          max: value * 1.2
        };
      }
    }
    
    console.error('Invalid price range format:', priceRange);
    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};

export const validatePriceInRange = (price: number, min: number, max: number): boolean => {
  // Remove the tolerance as it's now handled in parsePriceRange
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    return false;
  }
  
  // Strict price validation
  const isInRange = price >= min && price <= max;
  
  if (!isInRange) {
    console.log(`Price ${price} is outside range ${min}-${max}`);
  }
  
  return isInRange;
};

export const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  
  // Remove currency symbols and clean up the string
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  
  // Validate the extracted price
  if (isNaN(price) || price <= 0) {
    console.log('Invalid price extracted:', priceStr);
    return undefined;
  }
  
  return price;
};