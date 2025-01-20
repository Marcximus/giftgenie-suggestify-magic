export const extractPrice = (priceData: any): number | undefined => {
  console.log('Attempting to extract price from:', {
    raw: priceData,
    type: typeof priceData,
    isObject: typeof priceData === 'object',
    hasPrice: priceData?.price,
    hasCurrentPrice: priceData?.current_price
  });

  // If it's already a number, return it
  if (typeof priceData === 'number' && !isNaN(priceData)) {
    return priceData;
  }

  // Handle price object with current_price
  if (priceData && typeof priceData === 'object') {
    if (priceData.current_price) {
      const currentPrice = parseFloat(priceData.current_price.toString());
      if (!isNaN(currentPrice)) return currentPrice;
    }
    if (priceData.price) {
      const price = parseFloat(priceData.price.toString());
      if (!isNaN(price)) return price;
    }
  }

  // Handle string prices
  if (typeof priceData === 'string') {
    const cleanPrice = priceData.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleanPrice);
    if (!isNaN(price)) return price;
  }

  return undefined;
};

export const formatPriceForDisplay = (price: number | undefined): string => {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'Check price on Amazon';
  }
  return `USD ${price.toFixed(2)}`;
};