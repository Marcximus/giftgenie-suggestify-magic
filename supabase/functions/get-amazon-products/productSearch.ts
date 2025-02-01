import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import type { AmazonProduct } from './types.ts';

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

  // Construct URL with required parameters
  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', cleanedTerm);
  url.searchParams.append('country', 'US');
  url.searchParams.append('category_id', 'aps');
  url.searchParams.append('min_price', minPrice.toString());
  url.searchParams.append('max_price', maxPrice.toString());

  // Log the complete URL being sent
  console.log('Making request to Amazon API:', {
    fullUrl: url.toString(),
    host: url.host,
    pathname: url.pathname,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    headers: {
      'X-RapidAPI-Key': 'PRESENT (not shown)',
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  });

  try {
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
      console.log('No products found in Amazon API response');
      return null;
    }

    // Take the first product from the response
    const product = searchData.data.products[0];
    console.log('Selected first product:', {
      title: product.title,
      hasPrice: !!product.product_price,
      hasImage: !!product.product_photo,
      hasAsin: !!product.asin
    });

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

  } catch (error) {
    console.error('Error in Amazon product search:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
    throw error;
  }
};