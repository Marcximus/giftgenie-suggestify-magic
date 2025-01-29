export const validatePriceInRange = (
  price: number, 
  minBudget: number, 
  maxBudget: number, 
  tolerance = 0.2
): boolean => {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    console.log('Invalid price:', price);
    return false;
  }

  // Allow for 20% tolerance
  const minWithTolerance = minBudget * (1 - tolerance);
  const maxWithTolerance = maxBudget * (1 + tolerance);
  
  const isValid = price >= minWithTolerance && price <= maxWithTolerance;
  
  if (!isValid) {
    console.log(`Price $${price} outside range $${minWithTolerance}-$${maxWithTolerance}`);
  }
  
  return isValid;
};

export const extractPriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove currency symbols and extra spaces
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    
    // Handle hyphen-separated range (e.g., "20-50")
    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        return { min, max };
      }
    }
    
    // Handle single number with variance (e.g., "around 30")
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      // Use 20% variance for single prices
      return {
        min: singlePrice * 0.8,
        max: singlePrice * 1.2
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};