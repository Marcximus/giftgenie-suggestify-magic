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
    if ('current_price' in priceData) {
      const currentPrice = parseFloat(String(priceData.current_price));
      if (!isNaN(currentPrice)) return currentPrice;
    }
    if ('price' in priceData) {
      const price = parseFloat(String(priceData.price));
      if (!isNaN(price)) return price;
    }
  }

  // Handle string prices
  if (typeof priceData === 'string') {
    const cleanPrice = priceData.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleanPrice);
    if (!isNaN(price)) return price;
  }

  console.log('Failed to extract valid price from:', priceData);
  return undefined;
};

export const formatPriceForDisplay = (price: number | undefined): string => {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'Check price on Amazon';
  }
  return `USD ${price.toFixed(2)}`;
};