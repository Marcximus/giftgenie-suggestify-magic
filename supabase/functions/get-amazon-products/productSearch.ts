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

  console.log('Starting Amazon product search with:', {
    searchTerm,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length
  });

  const cleanedTerm = cleanSearchTerm(searchTerm);
  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', cleanedTerm);
  url.searchParams.append('country', 'US');
  url.searchParams.append('category_id', 'aps');

  console.log('Making Amazon API request to:', url.toString());
  console.log('Request headers:', {
    'X-RapidAPI-Key': apiKey ? `${apiKey.substring(0, 4)}...` : 'missing',
    'X-RapidAPI-Host': RAPIDAPI_HOST
  });

  try {
    const searchResponse = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    console.log('Amazon API response status:', searchResponse.status);
    console.log('Amazon API response headers:', Object.fromEntries(searchResponse.headers.entries()));

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
      
      if (searchResponse.status === 403) {
        throw new Error('API subscription error: Please check the RapidAPI subscription status');
      }

      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Amazon API raw response:', JSON.stringify(searchData, null, 2));

    if (!searchData.data?.products?.[0]) {
      console.log('No products found in Amazon API response');
      return null;
    }

    const product = searchData.data.products[0];
    console.log('Selected product data:', {
      title: product.title,
      hasImage: !!product.product_photo,
      hasAsin: !!product.asin,
      imageUrl: product.product_photo || product.thumbnail
    });

    if (!product.asin) {
      console.log('No ASIN found in first product, searching for product with ASIN');
      const productWithAsin = searchData.data.products.find((p: any) => p.asin);
      if (!productWithAsin) {
        console.log('No product with ASIN found in results');
        return null;
      }
      console.log('Found alternative product with ASIN:', productWithAsin.asin);
      return formatProduct(productWithAsin);
    }

    return formatProduct(product);
  } catch (error) {
    console.error('Error in Amazon product search:', error);
    throw error;
  }
};

const formatProduct = (product: any): AmazonProduct => {
  console.log('Formatting product data:', {
    title: product.title,
    hasImage: !!product.product_photo,
    hasAsin: !!product.asin,
    imageUrl: product.product_photo || product.thumbnail
  });

  const formattedProduct = {
    title: product.title,
    description: product.product_description || product.title,
    price: formatPrice(product.product_price),
    currency: 'USD',
    imageUrl: product.product_photo || product.thumbnail,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
    asin: product.asin
  };

  console.log('Formatted product result:', formattedProduct);
  return formattedProduct;
};

const formatPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? undefined : price;
};