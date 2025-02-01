export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

// Only block terms that indicate non-product content
const BLACKLISTED_TERMS = [
  'cancel subscription',
  'guide',
  'manual',
  'how to',
  'instruction',
  'handbook',
  'tutorial',
  'subscription',
  'cancel',
  'refund',
  'return policy',
  'warranty claim',
  'customer service'
];

const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const simplifySearchTerm = (searchTerm: string, preserveContext = true): string => {
  let simplified = searchTerm
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(?:edition|version|series)\b/gi, '')
    .trim();
    
  if (!preserveContext) {
    simplified = simplified
      .replace(/-.*$/, '')
      .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '')
      .trim();
  }
  
  return simplified;
};

export const buildSearchUrl = (term: string, priceRange?: { min?: number; max?: number }) => {
  const params = new URLSearchParams({
    query: term.trim(),
    country: 'US',
    sort_by: 'RELEVANCE'
  });

  // Always add price range parameters if they exist
  if (priceRange?.min !== undefined) {
    params.append('min_price', priceRange.min.toString());
    console.log('Adding min_price parameter:', priceRange.min);
  }
  if (priceRange?.max !== undefined) {
    params.append('max_price', priceRange.max.toString());
    console.log('Adding max_price parameter:', priceRange.max);
  }

  const url = `https://${RAPIDAPI_HOST}/search?${params.toString()}`;
  console.log('Constructed URL:', url);
  return url;
};

export const getFallbackSearchTerms = (searchTerm: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const searchTerms = [];
  
  if (words.length > 3) {
    searchTerms.push(words.slice(0, 3).join(' '));
    searchTerms.push([words[0], words[1], words[words.length - 1]].join(' '));
  } else {
    searchTerms.push(words.join(' '));
  }
  
  return [...new Set(searchTerms)];
};

const validateSearchTerm = (term: string): boolean => {
  const lowercaseTerm = term.toLowerCase();
  
  if (BLACKLISTED_TERMS.some(blacklisted => 
    lowercaseTerm.includes(blacklisted.toLowerCase())
  )) {
    console.log('Search term contains blacklisted phrase:', term);
    return false;
  }

  if (term.length < 3 || term.split(' ').length < 2) {
    console.log('Search term too short or simple:', term);
    return false;
  }

  return true;
};

const validateProduct = (product: any, priceRange?: { min?: number; max?: number }): boolean => {
  const hasBlacklistedTerm = BLACKLISTED_TERMS.some(term => 
    (product.title?.toLowerCase().includes(term) || 
     product.product_description?.toLowerCase().includes(term))
  );
  
  if (hasBlacklistedTerm) {
    console.log('Product filtered - contains blacklisted term:', product.title);
    return false;
  }

  if (product.product_star_rating) {
    const rating = parseFloat(product.product_star_rating);
    if (rating < 3.5) {
      console.log('Product filtered - low rating:', rating);
      return false;
    }
  }

  if (product.product_num_ratings) {
    const reviews = parseInt(product.product_num_ratings);
    if (reviews < 10) {
      console.log('Product filtered - insufficient reviews:', reviews);
      return false;
    }
  }

  if (priceRange && product.product_price) {
    const price = extractPrice(product.product_price);
    if (!price || 
        (priceRange.min !== undefined && price < priceRange.min) || 
        (priceRange.max !== undefined && price > priceRange.max)) {
      console.log('Product filtered - price out of range:', price);
      return false;
    }
  }

  return true;
};

export const formatProduct = (product: any): AmazonProduct => {
  return {
    title: product.title,
    description: product.product_description || product.title,
    price: extractPrice(product.product_price),
    currency: 'USD',
    imageUrl: product.product_photo || product.thumbnail,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
    asin: product.asin
  };
};

export const searchProducts = async (
  searchTerms: string[],
  apiKey: string,
  priceRange?: { min?: number; max?: number }
): Promise<AmazonProduct[]> => {
  if (!searchTerms.length) {
    console.error('No search terms provided');
    return [];
  }

  const validSearchTerms = searchTerms
    .map(cleanSearchTerm)
    .filter(validateSearchTerm);

  if (!validSearchTerms.length) {
    console.log('No valid search terms after filtering');
    return [];
  }

  console.log('Starting product search with validated terms:', validSearchTerms);
  console.log('Using price range:', priceRange);
  
  const makeSearchRequest = async (term: string) => {
    const url = buildSearchUrl(term, priceRange);
    console.log(`Making ${term === validSearchTerms[0] ? 'initial' : 'fallback'} request to:`, url);
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!response.ok) {
      console.error(`API error for term "${term}":`, response.status);
      return null;
    }

    const data = await response.json();
    console.log(`Response for term "${term}":`, data);
    
    if (!data.data?.products?.length) {
      console.log(`No products found for term "${term}"`);
      return null;
    }

    const validProducts = data.data.products
      .filter(product => validateProduct(product, priceRange))
      .map(formatProduct);

    return validProducts[0] || null;
  };
  
  const results: AmazonProduct[] = [];
  
  // Try initial search terms
  for (const term of validSearchTerms) {
    const product = await makeSearchRequest(term);
    if (product) {
      results.push(product);
    } else {
      // If initial search fails, try simplified version with same price range
      const simplifiedTerm = simplifySearchTerm(term, false);
      if (simplifiedTerm !== term) {
        console.log(`Trying simplified term "${simplifiedTerm}" with price range:`, priceRange);
        const fallbackProduct = await makeSearchRequest(simplifiedTerm);
        if (fallbackProduct) {
          results.push(fallbackProduct);
        }
      }
    }
  }

  return results;
};
