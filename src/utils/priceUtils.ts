/**
 * Formats a price value with consistent styling
 */
export const formatPrice = (price: string | number | undefined): string => {
  if (price === undefined || price === null) {
    return 'Check price on Amazon';
  }
  
  if (typeof price === 'number' && !isNaN(price)) {
    return `USD ${Math.floor(price)}`;
  }
  
  if (typeof price === 'string') {
    if (price === 'Check price on Amazon') {
      return price;
    }
    
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (!isNaN(numericPrice)) {
      return `USD ${Math.floor(numericPrice)}`;
    }
  }

  return 'Check price on Amazon';
};

/**
 * Process multiple prices in parallel
 */
export const processPricesInParallel = async (
  prices: (string | number | undefined)[]
): Promise<string[]> => {
  return Promise.all(
    prices.map(async (price) => {
      // Simulate some async work to allow parallel processing
      await new Promise(resolve => setTimeout(resolve, 0));
      return formatPrice(price);
    })
  );
};