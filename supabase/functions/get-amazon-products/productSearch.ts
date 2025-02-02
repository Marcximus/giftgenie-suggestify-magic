import { RAPIDAPI_HOST } from './config';
import { AmazonProduct, SearchConfig } from './types';
import { generateFallbackTerms } from './fallbackGenerator';
import { cleanSearchTerm, corsHeaders } from './searchUtils';

const searchWithTerm = async (
  term: string, 
  apiKey: string,
  config: SearchConfig,
  usePriceConstraints: boolean
): Promise<AmazonProduct | null> => {
  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', term);
  url.searchParams.append('country', config.country || 'US');
  url.searchParams.append('category_id', config.categoryId || 'aps');
  url.searchParams.append('sort_by', 'RELEVANCE');
  
  if (usePriceConstraints && config.minPrice && config.maxPrice) {
    url.searchParams.append('min_price', config.minPrice.toString());
    url.searchParams.append('max_price', config.maxPrice.toString());
  }

  console.log('Making request to Amazon API:', {
    searchTerm: term,
    fullUrl: url.toString(),
    usePriceConstraints,
    priceRange: usePriceConstraints ? { 
      minPrice: config.minPrice, 
      maxPrice: config.maxPrice 
    } : 'No price constraints'
  });

  const searchResponse = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    }
  });

  if (!searchResponse.ok) {
    console.error('Amazon Search API error:', searchResponse.status);
    throw new Error(`Amazon API error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  if (!searchData.data?.products?.length) {
    return null;
  }

  const product = searchData.data.products[0];
  const priceValue = product.product_price ? 
    parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : 
    undefined;

  return {
    title: product.title,
    description: product.product_description || product.title,
    price: priceValue,
    currency: 'USD',
    imageUrl: product.product_photo || product.thumbnail,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
    asin: product.asin
  };
};

export const searchProducts = async (
  searchTerm: string,
  apiKey: string,
  priceRange?: { min?: number; max?: number }
): Promise<AmazonProduct | null> => {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    console.error('Invalid or missing search term:', searchTerm);
    throw new Error('Search term is required and must be a non-empty string');
  }

  const cleanedTerm = cleanSearchTerm(searchTerm);
  const searchConfig: SearchConfig = {
    minPrice: priceRange?.min ?? 1,
    maxPrice: priceRange?.max ?? 1000,
    country: 'US',
    categoryId: 'aps'
  };

  try {
    // First try with exact search term
    let product = await searchWithTerm(cleanedTerm, apiKey, searchConfig, true);
    
    if (!product) {
      console.log('No products found with original term, trying fallback search');
      const fallbackTerms = generateFallbackTerms(cleanedTerm);
      
      for (const { searchTerm: fallbackTerm, usePriceConstraints } of fallbackTerms) {
        console.log('Trying fallback term:', { fallbackTerm, usePriceConstraints });
        product = await searchWithTerm(fallbackTerm, apiKey, searchConfig, usePriceConstraints);
        
        if (product) {
          console.log('Found product with fallback term:', { 
            fallbackTerm, 
            usePriceConstraints,
            productTitle: product.title,
            productPrice: product.price 
          });
          break;
        }
      }
    }

    return product;

  } catch (error) {
    console.error('Error in Amazon product search:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
    throw error;
  }
};