const productTypes = [
  'bookmark', 'book', 'headphones', 'earbuds', 'watch', 'camera', 'speaker',
  'kindle', 'tablet', 'phone', 'laptop', 'monitor', 'keyboard', 'mouse',
  'chair', 'desk', 'lamp', 'bag', 'wallet', 'pen', 'pencil', 'notebook',
  'guitar', 'piano', 'drum', 'vinyl', 'record', 'player', 'turntable'
];

const commonBrands = [
  'sony', 'samsung', 'apple', 'microsoft', 'amazon', 'logitech', 'bose',
  'canon', 'nikon', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'lg', 'jbl',
  'nintendo', 'playstation', 'xbox', 'fitbit', 'garmin', 'kindle', 'moleskine',
  'lego', 'nike', 'adidas', 'puma', 'reebok', 'casio', 'seiko', 'timex'
];

const materials = [
  'leather', 'wooden', 'metal', 'plastic', 'glass', 'ceramic',
  'wireless', 'bluetooth', 'digital', 'analog', 'electric',
  'portable', 'rechargeable', 'smart', 'premium', 'professional',
  'gaming', 'waterproof', 'noise-cancelling', 'mechanical'
];

export const getProductType = (term: string): string | null => {
  const words = term.toLowerCase().split(' ');
  return words.find(word => productTypes.includes(word)) || null;
};

export const getBrandName = (term: string): string | null => {
  const words = term.toLowerCase().split(' ');
  return words.find(word => commonBrands.includes(word)) || null;
};

export const getMaterialOrAttribute = (term: string): string | null => {
  const words = term.toLowerCase().split(' ');
  return words.find(word => materials.includes(word)) || null;
};