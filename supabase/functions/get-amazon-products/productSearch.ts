import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import { parsePriceRange, validatePriceInRange, extractPrice } from './priceUtils.ts';
import type { AmazonProduct } from './types.ts';

export const searchProducts = async (
  searchTerm: string,
  apiKey: string,
  priceRange?: string
): Promise<AmazonProduct | null> => {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    console.error('Invalid or missing search term:', searchTerm);
    throw new Error('Search term is required and must be a non-empty string');
  }

  console.log('Starting Amazon product search with:', {
    searchTerm,
    priceRange,
    hasApiKey: !!apiKey
  });

  const cleanedTerm = cleanSearchTerm(searchTerm);
  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', cleanedTerm);
  url.searchParams.append('country', 'US');
  url.searchParams.append('category_id', 'aps');

  // Parse price range if provided
  let priceConstraints = null;
  if (priceRange) {
    priceConstraints = parsePriceRange(priceRange);
    if (priceConstraints) {
      url.searchParams.append('min_price', priceConstraints.min.toString());
      url.searchParams.append('max_price', priceConstraints.max.toString());
      console.log('Added price constraints:', priceConstraints);
    }
  }

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
        body: responseText
      });

      if (searchResponse.status === 429) {
        throw new Error('Rate limit exceeded for Amazon API');
      }
      
      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Amazon API raw response:', {
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
        const price = extractPrice(product.product_price);
        if (!price) return false;
        return validatePriceInRange(price, priceConstraints.min, priceConstraints.max);
      });

      console.log('Filtered products by price range:', {
        original: searchData.data.products.length,
        filtered: validProducts.length
      });

      if (validProducts.length === 0) {
        console.log('No products found within price range');
        return null;
      }
    }

    const product = validProducts[0];
    console.log('Selected product:', {
      title: product.title,
      price: product.product_price,
      hasImage: !!product.product_photo
    });

    return formatProduct(product);
  } catch (error) {
    console.error('Error in Amazon product search:', error);
    throw error;
  }
};

const formatProduct = (product: any): AmazonProduct => {
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