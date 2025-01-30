export const extractPrice = (priceString: string | undefined): number | null => {
  if (!priceString) return null;

  // Remove currency symbols and clean up the string
  const cleaned = priceString.replace(/[^0-9.,]/g, '');
  const price = parseFloat(cleaned);

  if (isNaN(price) || price <= 0) {
    console.log('Invalid price extracted:', { original: priceString, cleaned, parsed: price });
    return null;
  }

  return price;
};

export const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove currency symbols and clean up
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    console.log('Parsing price range:', { original: priceRange, cleaned: cleanRange });
    
    // Handle hyphen-separated range (e.g., "20-50")
    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        console.log('Successfully parsed range:', { min, max });
        return { min, max };
      }
    }
    
    // Handle single number (e.g., "around 30")
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      // Use 20% variance for single prices
      const min = Math.floor(singlePrice * 0.8);
      const max = Math.ceil(singlePrice * 1.2);
      console.log('Using price variance:', { original: singlePrice, min, max });
      return { min, max };
    }

    console.log('Failed to parse price range:', priceRange);
    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};

export const validatePriceInRange = (price: number, min: number, max: number): boolean => {
  // Strict validation - price must be within range inclusive
  const isValid = price >= min && price <= max;
  console.log('Validating price:', { price, min, max, isValid });
  return isValid;
};