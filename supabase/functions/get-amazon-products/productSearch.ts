import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import type { AmazonProduct } from './types.ts';

const getProductType = (term: string): string | null => {
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

const getBrandName = (term: string): string | null => {
  const commonBrands = [
    'sony', 'samsung', 'apple', 'microsoft', 'amazon', 'logitech', 'bose',
    'canon', 'nikon', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'lg', 'jbl',
    'nintendo', 'playstation', 'xbox', 'fitbit', 'garmin', 'kindle', 'moleskine',
    'lego', 'nike', 'adidas', 'puma', 'reebok', 'casio', 'seiko', 'timex'
  ];

  const words = term.toLowerCase().split(' ');
  for (const word of words) {
    if (commonBrands.includes(word)) {
      return word;
    }
  }
  return null;
};

const getMaterialOrAttribute = (term: string): string | null => {
  const materials = [
    'leather', 'wooden', 'metal', 'plastic', 'glass', 'ceramic',
    'wireless', 'bluetooth', 'digital', 'analog', 'electric',
    'portable', 'rechargeable', 'smart', 'premium', 'professional',
    'gaming', 'waterproof', 'noise-cancelling', 'mechanical'
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
  const brand = getBrandName(term);
  const attribute = getMaterialOrAttribute(term);
  const fallbackTerms = [];

  if (!productType) {
    return [cleanSearchTerm(term)];
  }

  // First fallback: Brand + Product Type + Attribute
  if (brand && attribute) {
    fallbackTerms.push(`${brand} ${productType} ${attribute}`);
  }

  // Second fallback: Brand + Product Type
  if (brand) {
    fallbackTerms.push(`${brand} ${productType}`);
  }

  // Third fallback: Product Type + Attribute
  if (attribute) {
    fallbackTerms.push(`${attribute} ${productType}`);
  }

  // Fourth fallback: Just the Product Type
  fallbackTerms.push(productType);

  console.log('Generated fallback terms:', {
    originalTerm: term,
    productType,
    brand,
    attribute,
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
  const minPrice = priceRange?.min ?? 1;
  const maxPrice = priceRange?.max ?? 1000;

  const searchWithTerm = async (term: string): Promise<AmazonProduct | null> => {
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
      priceRange: { minPrice, maxPrice }
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
        body: responseText
      });

      if (searchResponse.status === 429) {
        throw new Error('Rate limit exceeded for Amazon API');
      }
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

  try {
    let product = await searchWithTerm(cleanedTerm);
    
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