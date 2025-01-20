/**
 * Formats a price value with consistent styling
 */
export const formatPrice = (price: string | number | undefined): string => {
  // Early return for undefined/null values
  if (!price) {
    return 'Check price on Amazon';
  }
  
  // Handle numeric values directly
  if (typeof price === 'number') {
    return !isNaN(price) ? `USD ${Math.floor(price)}` : 'Check price on Amazon';
  }
  
  // Handle string values
  if (price === 'Check price on Amazon') {
    return price;
  }
  
  const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
  return !isNaN(numericPrice) ? `USD ${Math.floor(numericPrice)}` : 'Check price on Amazon';
};

/**
 * Process multiple prices in parallel with optimized batch processing
 */
export const processPricesInParallel = async (
  prices: (string | number | undefined)[]
): Promise<string[]> => {
  // Process in chunks of 10 for better performance
  const chunkSize = 10;
  const chunks = [];
  
  for (let i = 0; i < prices.length; i += chunkSize) {
    chunks.push(prices.slice(i, i + chunkSize));
  }
  
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      return chunk.map(price => formatPrice(price));
    })
  );
  
  return results.flat();
};