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
  // Extract category based on common keywords
  const categories = {
    tech: ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'watch', 'camera'],
    home: ['kitchen', 'decor', 'furniture', 'appliance'],
    fashion: ['jacket', 'shoes', 'bag', 'wallet', 'jewelry'],
    hobby: ['game', 'book', 'sport', 'craft', 'art'],
    beauty: ['makeup', 'skincare', 'perfume', 'cosmetic']
  };
  
  const cleanTitle = title.toLowerCase().replace(/<[^>]*>/g, '');
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => cleanTitle.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
};