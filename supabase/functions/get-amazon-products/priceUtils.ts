export const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  
  // Remove currency symbol, commas, and any text
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  
  if (isNaN(price)) {
    console.warn('Failed to parse price:', { original: priceStr, cleaned: cleanPrice });
    return undefined;
  }

  console.log('Extracted price:', { original: priceStr, parsed: price });
  return price;
};

export const getPriceFromMultipleSources = (
  productPrice?: string,
  originalPrice?: string,
  currentPrice?: string
): number | undefined => {
  // Try each price source in order of preference
  return extractPrice(productPrice) || 
         extractPrice(originalPrice) ||
         extractPrice(currentPrice);
};