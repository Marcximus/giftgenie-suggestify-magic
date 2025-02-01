export const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove currency symbol and any whitespace
    const cleanRange = priceRange.replace(/[^0-9-]/g, '');
    
    // Split on hyphen
    const [min, max] = cleanRange.split('-').map(Number);
    
    if (isNaN(min) || isNaN(max)) {
      console.error('Invalid price range format:', priceRange);
      return null;
    }

    return { min, max };
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};

export const extractPrice = (priceData: any): number | undefined => {
  console.log('Extracting price from:', priceData);

  // If it's already a valid number, return it
  if (typeof priceData === 'number' && !isNaN(priceData)) {
    return priceData;
  }

  // If it's a string, try to parse it
  if (typeof priceData === 'string') {
    const cleanPrice = priceData.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleanPrice);
    if (!isNaN(price)) {
      return price;
    }
  }

  // Handle price object with current_price
  if (typeof priceData === 'object' && priceData !== null) {
    // Check for current_price property
    if ('current_price' in priceData) {
      const currentPrice = parseFloat(String(priceData.current_price));
      if (!isNaN(currentPrice) && currentPrice > 0) {
        return currentPrice;
      }
    }

    // Check for price property
    if ('price' in priceData) {
      const price = parseFloat(String(priceData.price));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }

    // Check for value property
    if ('value' in priceData) {
      const value = parseFloat(String(priceData.value));
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }

    // Check for amount property
    if ('amount' in priceData) {
      const amount = parseFloat(String(priceData.amount));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  // If no valid price found, return undefined
  console.warn('Could not extract valid price from:', priceData);
  return undefined;
};

export const validatePrice = (price: number | undefined): boolean => {
  if (typeof price !== 'number') return false;
  if (isNaN(price)) return false;
  if (price <= 0) return false;
  if (price > 100000) return false; // Sanity check for unreasonably high prices
  return true;
};