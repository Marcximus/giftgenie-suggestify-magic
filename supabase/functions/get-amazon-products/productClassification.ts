const productTypes = [
  'bookmark', 'book', 'headphones', 'earbuds', 'watch', 'camera', 'speaker',
  'kindle', 'tablet', 'phone', 'laptop', 'monitor', 'keyboard', 'mouse',
  'chair', 'desk', 'lamp', 'bag', 'wallet', 'pen', 'pencil', 'notebook',
  'guitar', 'piano', 'drum', 'vinyl', 'record', 'player', 'turntable',
  'game', 'console', 'controller', 'charger', 'cable', 'case', 'stand',
  'holder', 'mount', 'storage', 'organizer', 'basket', 'box', 'container',
  'mug', 'cup', 'bottle', 'flask', 'thermos', 'cooler', 'blanket', 'pillow',
  'cushion', 'mat', 'rug', 'carpet', 'curtain', 'mirror', 'clock', 'frame',
  'art', 'print', 'poster', 'painting', 'sculpture', 'figurine', 'statue',
  'toy', 'puzzle', 'model', 'kit', 'set', 'collection', 'bundle', 'pack'
];

const commonBrands = [
  'sony', 'samsung', 'apple', 'microsoft', 'amazon', 'logitech', 'bose',
  'canon', 'nikon', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'lg', 'jbl',
  'nintendo', 'playstation', 'xbox', 'fitbit', 'garmin', 'kindle', 'moleskine',
  'lego', 'nike', 'adidas', 'puma', 'reebok', 'casio', 'seiko', 'timex',
  'anker', 'belkin', 'razer', 'corsair', 'steelseries', 'thermaltake',
  'coolermaster', 'nzxt', 'crucial', 'western digital', 'seagate', 'sandisk',
  'kingston', 'netgear', 'tp-link', 'd-link', 'linksys', 'asus', 'acer'
];

const materials = [
  'leather', 'wooden', 'metal', 'plastic', 'glass', 'ceramic',
  'wireless', 'bluetooth', 'digital', 'analog', 'electric',
  'portable', 'rechargeable', 'smart', 'premium', 'professional',
  'gaming', 'waterproof', 'noise-cancelling', 'mechanical',
  'ergonomic', 'adjustable', 'foldable', 'compact', 'lightweight',
  'durable', 'heavy-duty', 'anti-slip', 'non-slip', 'shock-proof',
  'water-resistant', 'scratch-resistant', 'stain-resistant'
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