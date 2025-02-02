import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import type { AmazonProduct } from './types.ts';

const getProductType = (term: string): string | null => {
  // Common product type words - add more as needed
  const productTypes = [
    'bookmark', 'book', 'headphones', 'earbuds', 'watch', 'camera', 'speaker',
    'kindle', 'tablet', 'phone', 'laptop', 'monitor', 'keyboard', 'mouse',
    'chair', 'desk', 'lamp', 'bag', 'wallet', 'pen', 'pencil', 'notebook',
    'guitar', 'piano', 'drum', 'vinyl', 'record', 'player', 'turntable'
  ];

  const words = term.toLowerCase().split(' ');
  for (const word of words) {
    if (productTypes.includes(word)) {
      return word;
    }
  }
  return null;
};

const getMaterialOrAttribute = (term: string): string | null => {
  // Common materials and attributes
  const materials = [
    'leather', 'wooden', 'metal', 'plastic', 'glass', 'ceramic',
    'wireless', 'bluetooth', 'digital', 'analog', 'electric',
    'portable', 'rechargeable', 'smart', 'premium'
  ];

  const words = term.toLowerCase().split(' ');
  for (const word of words) {
    if (materials.includes(word)) {
      return word;
    }
  }
  return null;
};

const generateFallbackTerms = (term: string): string[] => {
  const productType = getProductType(term);
  const material = getMaterialOrAttribute(term);
  const fallbackTerms = [];

  if (!productType) {
    // If no product type found, return original cleaned term
    return [cleanSearchTerm(term)];
  }

  // First fallback: Product type with material/attribute if available
  if (material) {
    fallbackTerms.push(`${material} ${productType}`);
  }

  // Second fallback: Just the product type
  fallbackTerms.push(productType);

  console.log('Generated fallback terms:', {
    originalTerm: term,
    productType,
    material,
    fallbackTerms
  });

  return fallbackTerms;
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

  console.log('Starting Amazon product search with:', {
    searchTerm,
    priceRange,
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString()
  });

  const cleanedTerm = cleanSearchTerm(searchTerm);
  console.log('Cleaned search term:', cleanedTerm);

  // Use provided price range or defaults
  const minPrice = priceRange?.min ?? 1;
  const maxPrice = priceRange?.max ?? 1000;
  console.log('Using price constraints:', { minPrice, maxPrice });

  const searchWithTerm = async (term: string): Promise<AmazonProduct | null> => {
    // Construct URL with required parameters
    const url = new URL(`https://${RAPIDAPI_HOST}/search`);
    url.searchParams.append('query', term);
    url.searchParams.append('country', 'US');
    url.searchParams.append('category_id', 'aps');
    url.searchParams.append('min_price', minPrice.toString());
    url.searchParams.append('max_price', maxPrice.toString());
    url.searchParams.append('sort_by', 'RELEVANCE');

    console.log('Making request to Amazon API:', {
      searchTerm: term,
      fullUrl: url.toString(),
      host: url.host,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      headers: {
        'X-RapidAPI-Key': 'PRESENT (not shown)',
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });

    const searchResponse = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!searchResponse.ok) {
      const responseText = await searchResponse.text();
      console.error('Amazon Search API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        body: responseText,
        headers: Object.fromEntries(searchResponse.headers.entries())
      });

      if (searchResponse.status === 429) {
        throw new Error('Rate limit exceeded for Amazon API');
      }
      
      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Amazon API raw response:', {
      hasData: !!searchData.data,
      productsCount: searchData.data?.products?.length || 0,
      firstProduct: searchData.data?.products?.[0] ? {
        title: searchData.data.products[0].title,
        hasPrice: !!searchData.data.products[0].product_price,
        priceValue: searchData.data.products[0].product_price,
        hasImage: !!searchData.data.products[0].product_photo,
        imageUrl: searchData.data.products[0].product_photo,
        hasAsin: !!searchData.data.products[0].asin,
        asin: searchData.data.products[0].asin
      } : 'No products found'
    });

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

  try {
    // First attempt with original search term
    let product = await searchWithTerm(cleanedTerm);
    
    // If no product found, try fallback terms
    if (!product) {
      console.log('No products found with original term, trying fallback search');
      const fallbackTerms = generateFallbackTerms(cleanedTerm);
      
      for (const fallbackTerm of fallbackTerms) {
        console.log('Trying fallback term:', fallbackTerm);
        product = await searchWithTerm(fallbackTerm);
        if (product) {
          console.log('Found product with fallback term:', fallbackTerm);
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