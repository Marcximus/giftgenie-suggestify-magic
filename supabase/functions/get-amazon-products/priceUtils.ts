export const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  console.log('Attempting to extract price from:', { 
    rawPrice: priceStr,
    type: typeof priceStr,
    isNull: priceStr === null,
    isUndefined: priceStr === undefined
  });
  
  if (!priceStr) {
    console.log('Price is null or undefined');
    return undefined;
  }
  
  // Remove currency symbol, commas, and any text
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  
  if (isNaN(price)) {
    console.warn('Failed to parse price:', { 
      original: priceStr, 
      cleaned: cleanPrice,
      parseResult: price,
      isNaN: isNaN(price)
    });
    return undefined;
  }

  console.log('Successfully extracted price:', { 
    original: priceStr,
    parsed: price,
    cleaned: cleanPrice,
    type: typeof price 
  });
  return price;
};

export const getPriceFromMultipleSources = (
  productPrice?: string,
  originalPrice?: string,
  currentPrice?: string
): number | undefined => {
  console.log('Attempting to get price from multiple sources:', {
    productPrice,
    originalPrice,
    currentPrice,
    productPriceType: typeof productPrice,
    originalPriceType: typeof originalPrice,
    currentPriceType: typeof currentPrice
  });

  // Try each price source in order of preference
  const price = extractPrice(productPrice) || 
                extractPrice(originalPrice) ||
                extractPrice(currentPrice);

  console.log('Final price determination:', {
    result: price,
    wasFound: price !== undefined,
    resultType: typeof price
  });

  return price;
};