/**
 * Consolidated price transformation utility
 * Handles all price-related transformations in a single pass
 */
export const transformPrice = (price: string | number | undefined): {
  displayPrice: string;
  numericValue: number | null;
  currency: string;
} => {
  // Initialize default return object
  const result = {
    displayPrice: 'Check price on Amazon',
    numericValue: null,
    currency: 'USD'
  };

  // Early return for invalid input
  if (!price) {
    return result;
  }

  // Handle numeric input
  if (typeof price === 'number') {
    if (!isNaN(price)) {
      return {
        displayPrice: `USD ${Math.floor(price)}`,
        numericValue: Math.floor(price),
        currency: 'USD'
      };
    }
    return result;
  }

  // Handle string input
  if (price === 'Check price on Amazon') {
    return result;
  }

  // Extract numeric value and currency
  const numericMatch = price.match(/[\d.]+/);
  const currencyMatch = price.match(/[A-Z]{3}/);

  if (numericMatch) {
    const numericValue = Math.floor(parseFloat(numericMatch[0]));
    if (!isNaN(numericValue)) {
      return {
        displayPrice: `${currencyMatch?.[0] || 'USD'} ${numericValue}`,
        numericValue,
        currency: currencyMatch?.[0] || 'USD'
      };
    }
  }

  return result;
};

/**
 * Process multiple prices in parallel with consolidated transformation
 */
export const processPricesInBatch = async (
  prices: (string | number | undefined)[],
  batchSize = 10
): Promise<Array<ReturnType<typeof transformPrice>>> => {
  // Create batches for processing
  const batches = [];
  for (let i = 0; i < prices.length; i += batchSize) {
    batches.push(prices.slice(i, i + batchSize));
  }

  // Process batches in parallel
  const results = await Promise.all(
    batches.map(batch => Promise.all(batch.map(transformPrice)))
  );

  return results.flat();
};

// Backward compatibility function
export const formatPrice = (price: string | number | undefined): string => {
  return transformPrice(price).displayPrice;
};