export const formatPrice = (price: string | number): string => {
  // Handle undefined or null
  if (!price) return 'N/A';

  // Convert to number if string
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;

  // Check if conversion resulted in a valid number
  if (isNaN(numericPrice)) return 'N/A';

  // Format the price with USD currency
  return `USD ${numericPrice.toFixed(2)}`;
};