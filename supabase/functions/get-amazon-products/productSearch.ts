import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import type { AmazonProduct } from './types.ts';

export const searchProducts = async (
  searchTerm: string,
  apiKey: string,
  priceConstraints?: { min: number; max: number } | null
): Promise<AmazonProduct | null> => {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    console.error('Invalid or missing search term:', searchTerm);
    throw new Error('Search term is required and must be a non-empty string');
  }

  console.log('Starting Amazon product search with:', {
    searchTerm,
    priceConstraints,
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString()
  });

  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', searchTerm.trim());
  url.searchParams.append('country', 'US');
  url.searchParams.append('sort_by', 'RELEVANCE');

  // Always include price constraints, with defaults if not provided
  if (priceConstraints) {
    url.searchParams.append('min_price', priceConstraints.min.toString());
    url.searchParams.append('max_price', priceConstraints.max.toString());
    console.log('Added price constraints:', priceConstraints);
  } else {
    // Default price range if none provided
    url.searchParams.append('min_price', '1');
    url.searchParams.append('max_price', '1000');
    console.log('Using default price range: $1-$1000');
  }

  try {
    console.log('Making request to Amazon API:', url.toString());
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

      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Amazon API response:', {
      hasData: !!searchData.data,
      productsCount: searchData.data?.products?.length || 0
    });

    if (!searchData.data?.products?.length) {
      console.log('No products found in Amazon API response');
      return null;
    }

    // Filter products by price if constraints exist
    let validProducts = searchData.data.products;
    if (priceConstraints) {
      validProducts = validProducts.filter(product => {
        const price = parseFloat(product.product_price?.replace(/[^0-9.]/g, '') || '0');
        const isValid = price >= priceConstraints.min && price <= priceConstraints.max;
        if (!isValid) {
          console.log(`Filtered out product "${product.title}" - price $${price} outside range $${priceConstraints.min}-$${priceConstraints.max}`);
        }
        return isValid;
      });
    }

    if (validProducts.length === 0) {
      console.log('No valid products found after price filtering');
      return null;
    }

    const product = validProducts[0];
    return {
      title: product.title,
      description: product.product_description || product.title,
      price: parseFloat(product.product_price?.replace(/[^0-9.]/g, '') || '0'),
      currency: 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
      asin: product.asin
    };
  } catch (error) {
    console.error('Error in Amazon product search:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
    throw error;
  }
};