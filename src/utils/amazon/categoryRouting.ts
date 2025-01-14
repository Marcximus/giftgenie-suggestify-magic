export interface CategoryRoute {
  subCategories: Record<string, string[]>;
  topBrands: Record<string, string[]>;
  priceRanges: Record<string, { low: number; mid: number; high: number }>;
}

export const categoryRoutes: Record<string, CategoryRoute> = {
  sports: {
    subCategories: {
      'basketball': ['equipment', 'apparel', 'accessories'],
      'football': ['equipment', 'apparel', 'accessories'],
      'soccer': ['equipment', 'apparel', 'accessories'],
      'tennis': ['equipment', 'apparel', 'accessories'],
      'fitness': ['equipment', 'apparel', 'accessories'],
      'running': ['equipment', 'apparel', 'accessories']
    },
    topBrands: {
      'equipment': ['Nike', 'Wilson', 'Spalding', 'Under Armour', 'Adidas'],
      'apparel': ['Nike', 'Under Armour', 'Adidas', 'Puma', 'New Balance'],
      'accessories': ['Nike', 'Under Armour', 'Adidas', 'Puma', 'New Balance']
    },
    priceRanges: {
      'equipment': { low: 15, mid: 50, high: 150 },
      'apparel': { low: 20, mid: 40, high: 100 },
      'accessories': { low: 10, mid: 30, high: 80 }
    }
  }
};

export const getSearchTerms = (suggestion: string, category: string): string[] => {
  const words = suggestion.toLowerCase().split(' ');
  const route = categoryRoutes[category];
  
  if (!route) {
    return [suggestion];
  }

  // Find matching subcategory
  const subcategory = Object.keys(route.subCategories)
    .find(sub => words.includes(sub));
  
  if (!subcategory) {
    return [suggestion];
  }

  // Get relevant brands for the subcategory
  const productType = route.subCategories[subcategory][0]; // Use first type
  const relevantBrands = route.topBrands[productType];

  // Generate search attempts in order of specificity
  return [
    suggestion, // Original search
    ...relevantBrands.map(brand => `${brand} ${subcategory}`), // Brand + subcategory
    `${subcategory} ${productType}`, // Generic category search
  ];
};