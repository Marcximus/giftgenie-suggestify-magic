export const extractPrice = (priceData: any): number | undefined => {
  console.log('Extracting price from:', {
    raw: priceData,
    type: typeof priceData,
    isObject: typeof priceData === 'object',
    hasCurrentPrice: priceData?.current_price !== undefined
  });

  // If it's already a valid number, return it
  if (typeof priceData === 'number' && !isNaN(priceData)) {
    return priceData;
  }

  // Handle price object with current_price
  if (priceData && typeof priceData === 'object') {
    // First try current_price as it's typically more accurate
    if ('current_price' in priceData) {
      const currentPrice = parseFloat(String(priceData.current_price));
      if (!isNaN(currentPrice) && currentPrice > 0) return currentPrice;
    }
    // Then try regular price
    if ('price' in priceData) {
      const price = parseFloat(String(priceData.price));
      if (!isNaN(price) && price > 0) return price;
    }
    // Finally try original_price
    if ('original_price' in priceData) {
      const originalPrice = parseFloat(String(priceData.original_price));
      if (!isNaN(originalPrice) && originalPrice > 0) return originalPrice;
    }
  }

  // Handle string prices with improved validation
  if (typeof priceData === 'string') {
    // Remove currency symbols and other non-numeric characters except decimal points
    const cleanPrice = priceData.replace(/[^0-9.]/g, '');
    // Handle cases with multiple decimal points
    const parts = cleanPrice.split('.');
    if (parts.length > 2) {
      // Take the first part and combine with the last part for decimal
      const validPrice = `${parts[0]}.${parts[parts.length - 1]}`;
      const price = parseFloat(validPrice);
      if (!isNaN(price) && price > 0) return price;
    } else {
      const price = parseFloat(cleanPrice);
      if (!isNaN(price) && price > 0) return price;
    }
  }

  console.log('Failed to extract valid price from:', priceData);
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

  // Allow for a 15% margin instead of 20% to be more strict
  const minAllowed = minBudget * 0.85;
  const maxAllowed = maxBudget * 1.15;

  return price >= minAllowed && price <= maxAllowed;
};

export const extractPriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Handle various price range formats
    const matches = priceRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (matches) {
      const min = parseFloat(matches[1]);
      const max = parseFloat(matches[2]);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        return { min, max };
      }
    }

    // Handle single price with variance
    const singlePrice = parseFloat(priceRange.replace(/[^0-9.]/g, ''));
    if (!isNaN(singlePrice) && singlePrice > 0) {
      // Use 15% variance for single prices
      return {
        min: singlePrice * 0.85,
        max: singlePrice * 1.15
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};