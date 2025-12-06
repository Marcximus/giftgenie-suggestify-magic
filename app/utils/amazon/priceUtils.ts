export const extractPrice = (priceData: any): number | undefined => {
  if (!priceData) return undefined;

  // If it's already a valid number, return it
  if (typeof priceData === 'number' && !isNaN(priceData)) {
    return priceData;
  }

  // Handle price object with current_price
  if (typeof priceData === 'object') {
    if ('current_price' in priceData) {
      const currentPrice = parseFloat(String(priceData.current_price));
      if (!isNaN(currentPrice) && currentPrice > 0) return currentPrice;
    }
    if ('price' in priceData) {
      const price = parseFloat(String(priceData.price));
      if (!isNaN(price) && price > 0) return price;
    }
  }

  // Handle string prices
  if (typeof priceData === 'string') {
    // Remove currency symbols and other non-numeric characters except decimal points
    const cleanPrice = priceData.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleanPrice);
    if (!isNaN(price) && price > 0) return price;
  }

  return undefined;
};

export const formatPriceForDisplay = (price: number | undefined): string => {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    return 'Check price on Amazon';
  }
  return `USD ${price.toFixed(2)}`;
};

export const validatePriceRange = (price: number, minBudget: number, maxBudget: number): boolean => {
  // Ensure we have valid numbers
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    return false;
  }
  if (typeof minBudget !== 'number' || isNaN(minBudget) || minBudget < 0) {
    return false;
  }
  if (typeof maxBudget !== 'number' || isNaN(maxBudget) || maxBudget < minBudget) {
    return false;
  }

  // Use a 20% margin for price range validation
  const minAllowed = minBudget * 0.8;
  const maxAllowed = maxBudget * 1.2;

  return price >= minAllowed && price <= maxAllowed;
};

export const extractPriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove any currency symbols and extra spaces
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