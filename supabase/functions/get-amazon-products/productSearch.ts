import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import type { AmazonProduct } from './types.ts';

export const searchProducts = async (
  searchTerm: string,
  apiKey: string
): Promise<AmazonProduct | null> => {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    console.error('Invalid or missing search term:', searchTerm);
    throw new Error('Search term is required and must be a non-empty string');
  }

  console.log('Searching Amazon for:', searchTerm);
  const cleanedTerm = cleanSearchTerm(searchTerm);
  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', cleanedTerm);
  url.searchParams.append('country', 'US');

  console.log('Making request to:', url.toString());

  const searchResponse = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    }
  });

  if (!searchResponse.ok) {
    handleSearchError(searchResponse.status);
  }

  const searchData = await searchResponse.json();
  return processSearchResults(searchData);
};

const handleSearchError = (status: number): never => {
  console.error('Amazon Search API error:', { status });
  
  if (status === 403) {
    throw new Error('API subscription error: Please check the RapidAPI subscription status');
  }
  
  throw new Error(`Amazon API error: ${status}`);
};

const processSearchResults = (searchData: any): AmazonProduct | null => {
  console.log('Search response received:', {
    hasData: !!searchData.data,
    productsCount: searchData.data?.products?.length || 0
  });

  if (!searchData.data?.products?.[0]) {
    console.log('No products found');
    return null;
  }

  let product = searchData.data.products[0];
  
  if (!product.asin) {
    product = searchData.data.products.find((p: any) => p.asin);
    if (!product) {
      console.error('No product with ASIN found');
      return null;
    }
  }

  return {
    title: product.title,
    description: product.product_description || product.title,
    price: formatPrice(product.product_price),
    currency: 'USD',
    imageUrl: product.product_photo || product.thumbnail,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
    asin: product.asin
  };
};

const formatPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? undefined : price;
};