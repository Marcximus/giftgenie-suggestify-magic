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

export const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? undefined : price;
};