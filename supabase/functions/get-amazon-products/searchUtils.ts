const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

interface SearchConfig {
  categoryId: string;
  modifiedSearchTerm: string;
  minPrice?: number;
  maxPrice?: number;
  filterTags: string[];
}

const getSearchConfig = (ageGroup: string, searchTerm: string): SearchConfig => {
  // Base configuration
  const baseConfig: SearchConfig = {
    categoryId: 'aps',
    modifiedSearchTerm: searchTerm,
    filterTags: []
  };

  // Age-specific modifications
  switch(ageGroup) {
    case 'infant':
      return {
        ...baseConfig,
        categoryId: 'baby-products',
        modifiedSearchTerm: `${searchTerm} baby`,
        filterTags: ['baby', 'infant', 'toddler']
      };
      
    case 'child':
      return {
        ...baseConfig,
        categoryId: 'toys-games',
        modifiedSearchTerm: `${searchTerm} kids`,
        filterTags: ['kids', 'children']
      };
      
    case 'preteen':
      return {
        ...baseConfig,
        categoryId: 'toys-games',
        filterTags: ['preteen', 'tween']
      };
      
    case 'teen':
      return {
        ...baseConfig,
        categoryId: searchTerm.toLowerCase().includes('game') ? 'teen-gaming' : 'aps',
        filterTags: ['teen', 'teenager']
      };
      
    case 'youngAdult':
      return {
        ...baseConfig,
        filterTags: ['young adult', 'college']
      };
      
    case 'senior':
      return {
        ...baseConfig,
        categoryId: 'health-personal-care',
        filterTags: ['senior', 'elderly']
      };
      
    default:
      return baseConfig;
  }
};

const filterProductsByAgeGroup = (products: any[], filterTags: string[], ageGroup: string) => {
  const exclusions: Record<string, string[]> = {
    infant: ['choking hazard', 'adult', 'teen', 'not suitable for children'],
    child: ['adult only', 'mature', 'not suitable for children'],
    teen: ['toddler', 'baby', 'preschool'],
    preteen: ['toddler', 'baby', 'adult only'],
    youngAdult: ['toddler', 'baby', 'preschool'],
    senior: ['toddler', 'baby', 'teen']
  };

  return products.filter(product => {
    const title = (product.title || '').toLowerCase();
    const description = (product.product_description || '').toLowerCase();
    
    // Check for age-inappropriate content
    if (exclusions[ageGroup]) {
      const hasExclusions = exclusions[ageGroup].some(term => 
        title.includes(term) || description.includes(term)
      );
      if (hasExclusions) return false;
    }

    // Check if product matches age group tags
    const matchesTags = filterTags.some(tag => 
      title.includes(tag) || description.includes(tag)
    );

    return matchesTags || true; // Include if matches tags or no exclusions found
  });
};

export const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string,
  ageGroup?: string
) => {
  const config = getSearchConfig(ageGroup || 'adult', term);
  const cleanedTerm = cleanSearchTerm(config.modifiedSearchTerm);
  
  console.log('Searching with configuration:', {
    term: cleanedTerm,
    ageGroup,
    category: config.categoryId
  });

  // Weighted randomization for page selection
  const random = Math.random();
  const page = random < 0.7 ? 1 : random < 0.9 ? 2 : 3;

  const searchParams = new URLSearchParams({
    query: cleanedTerm,
    country: 'US',
    category_id: config.categoryId,
    sort_by: 'RELEVANCE',
    page: page.toString()
  });

  if (config.minPrice) searchParams.append('min_price', config.minPrice.toString());
  if (config.maxPrice) searchParams.append('max_price', config.maxPrice.toString());

  const searchResponse = await fetch(
    `https://${rapidApiHost}/search?${searchParams.toString()}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': rapidApiHost,
      }
    }
  );

  if (!searchResponse.ok) {
    if (searchResponse.status === 429) {
      throw new Error('rate limit exceeded');
    }
    throw new Error(`Amazon Search API error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  
  // Post-process results to ensure age appropriateness
  if (searchData.data?.products) {
    searchData.data.products = filterProductsByAgeGroup(
      searchData.data.products,
      config.filterTags,
      ageGroup || 'adult'
    );
  }

  console.log('Search response data:', {
    title: searchData.data?.products?.[0]?.title,
    totalResults: searchData.data?.products?.length || 0,
    ageGroup,
    categoryId: config.categoryId
  });
  
  return searchData;
};

export const simplifySearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\b(?:edition|version|series)\b/gi, '') // Remove common suffixes
    .replace(/-.*$/, '') // Remove anything after a hyphen
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '') // Remove sizes
    .trim();
};

export const getFallbackSearchTerms = (searchTerm: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const searchTerms = [];
  
  // Generate varied search combinations
  if (words.length > 2) {
    searchTerms.push(words.slice(0, 3).join(' '));
    searchTerms.push(words.slice(-3).join(' '));
    searchTerms.push([words[0], words[words.length - 1]].join(' '));
  }
  
  // Add interest-based variations
  const interests = ['gaming', 'sports', 'music', 'art', 'technology', 'reading', 'crafts', 'cooking'];
  const interestWord = words.find(word => interests.includes(word.toLowerCase()));
  if (interestWord) {
    searchTerms.push(interestWord);
  }
  
  // Add random variation
  const randomIndex = Math.floor(Math.random() * words.length);
  searchTerms.push(words[randomIndex]);
  
  console.log('Generated fallback search terms:', searchTerms);
  return [...new Set(searchTerms)]; // Remove duplicates
};