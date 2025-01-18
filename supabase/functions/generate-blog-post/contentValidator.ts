interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateBlogContent = (content: string): ValidationResult => {
  const errors: string[] = [];
  
  // Check for required sections
  if (!content.includes('<h1')) {
    errors.push('Missing main title (H1)');
  }
  
  // Count product sections (H3 tags)
  const productCount = (content.match(/<h3/g) || []).length;
  if (productCount < 3) {
    errors.push(`Only found ${productCount} products, minimum 3 required`);
  }
  
  // Check for duplicate categories
  const productTitles = content.match(/<h3[^>]*>(.*?)<\/h3>/g) || [];
  const categories = new Set();
  productTitles.forEach(title => {
    const category = getCategoryFromTitle(title);
    if (categories.has(category)) {
      errors.push(`Duplicate category found: ${category}`);
    }
    categories.add(category);
  });
  
  // Check for proper emoji usage
  if (!content.includes('🎁') || !content.includes('⭐') || !content.includes('💝')) {
    errors.push('Missing required emoji indicators');
  }
  
  // Check for proper feature lists
  const featureLists = content.match(/<ul class="my-4">/g) || [];
  if (featureLists.length < productCount) {
    errors.push('Missing feature lists for some products');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const getCategoryFromTitle = (title: string): string => {
  const categories = {
    tech: [
      'phone', 'laptop', 'tablet', 'headphone', 'speaker', 'watch', 'camera', 'drone',
      'computer', 'keyboard', 'mouse', 'monitor', 'printer', 'router', 'smart', 'wireless',
      'bluetooth', 'charger', 'power bank', 'fitness tracker', 'earbuds', 'gaming'
    ],
    home: [
      'kitchen', 'decor', 'furniture', 'appliance', 'coffee', 'tea', 'cookware', 'bedding',
      'blanket', 'pillow', 'lamp', 'rug', 'curtain', 'storage', 'organizer', 'vacuum',
      'blender', 'mixer', 'toaster', 'pot', 'pan', 'knife', 'utensil', 'plate', 'bowl'
    ],
    fashion: [
      'jacket', 'shoe', 'bag', 'wallet', 'jewelry', 'watch', 'scarf', 'glove', 'hat',
      'belt', 'sunglasses', 'backpack', 'purse', 'bracelet', 'necklace', 'ring',
      'earring', 'clothing', 'apparel', 'accessory', 'leather'
    ],
    hobby: [
      'game', 'book', 'sport', 'craft', 'art', 'paint', 'drawing', 'puzzle', 'board game',
      'card game', 'outdoor', 'camping', 'hiking', 'fishing', 'gardening', 'plant',
      'musical', 'instrument', 'yoga', 'exercise', 'fitness', 'hobby'
    ],
    beauty: [
      'makeup', 'skincare', 'perfume', 'cosmetic', 'beauty', 'hair', 'face', 'body',
      'lotion', 'cream', 'serum', 'mask', 'brush', 'nail', 'spa', 'massage', 'aromatherapy',
      'essential oil', 'shampoo', 'conditioner'
    ],
    food: [
      'gourmet', 'snack', 'chocolate', 'coffee', 'tea', 'wine', 'spirits', 'food',
      'cooking', 'baking', 'spice', 'seasoning', 'sauce', 'condiment', 'treat',
      'candy', 'drink', 'beverage'
    ],
    travel: [
      'luggage', 'suitcase', 'backpack', 'travel', 'passport', 'adapter', 'organizer',
      'portable', 'compact', 'lightweight', 'carry-on', 'travel-size', 'journey'
    ],
    pet: [
      'pet', 'dog', 'cat', 'bird', 'fish', 'animal', 'collar', 'leash', 'toy',
      'bed', 'food', 'treat', 'grooming', 'carrier', 'cage', 'aquarium'
    ]
  };
  
  const cleanTitle = title.toLowerCase().replace(/<[^>]*>/g, '');
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => cleanTitle.includes(keyword))) {
      return category;
    }
  }
  
  // Try to extract category from context
  if (cleanTitle.includes('fitness') || cleanTitle.includes('workout')) return 'hobby';
  if (cleanTitle.includes('smart') || cleanTitle.includes('digital')) return 'tech';
  if (cleanTitle.includes('comfort') || cleanTitle.includes('cozy')) return 'home';
  if (cleanTitle.includes('style') || cleanTitle.includes('fashion')) return 'fashion';
  if (cleanTitle.includes('care') || cleanTitle.includes('beauty')) return 'beauty';
  if (cleanTitle.includes('delicious') || cleanTitle.includes('taste')) return 'food';
  if (cleanTitle.includes('adventure') || cleanTitle.includes('journey')) return 'travel';
  if (cleanTitle.includes('companion') || cleanTitle.includes('animal')) return 'pet';
  
  // If no category is found, try to infer from common gift items
  if (cleanTitle.includes('set') || cleanTitle.includes('kit')) {
    if (cleanTitle.includes('care')) return 'beauty';
    if (cleanTitle.includes('tool')) return 'home';
    if (cleanTitle.includes('game')) return 'hobby';
  }
  
  return 'other';
};