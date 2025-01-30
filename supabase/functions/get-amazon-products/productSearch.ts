import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { buildSearchUrl } from './searchUtils.ts';
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
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString()
  });

  try {
    const url = buildSearchUrl(searchTerm, priceRange);
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

    // Verify each product's price strictly
    let validProduct = null;
    const parsedRange = priceRange ? parsePriceRange(priceRange) : null;

    for (const product of searchData.data.products) {
      const price = extractPrice(product.product_price);
      console.log('Checking product price:', {
        title: product.title,
        price,
        range: parsedRange
      });

      if (!price) {
        console.log('Skipping product - invalid price:', product.title);
        continue;
      }

      if (parsedRange) {
        if (!validatePriceInRange(price, parsedRange.min, parsedRange.max)) {
          console.log('Skipping product - outside price range:', {
            title: product.title,
            price,
            min: parsedRange.min,
            max: parsedRange.max
          });
          continue;
        }
      }

      validProduct = product;
      console.log('Found valid product within price range:', {
        title: product.title,
        price,
        range: parsedRange
      });
      break;
    }

    if (!validProduct) {
      console.log('No products found within specified price range');
      return null;
    }

    const finalPrice = extractPrice(validProduct.product_price);
    
    return {
      title: validProduct.title,
      description: validProduct.product_description || validProduct.title,
      price: finalPrice,
      currency: 'USD',
      imageUrl: validProduct.product_photo || validProduct.thumbnail,
      rating: validProduct.product_star_rating ? parseFloat(validProduct.product_star_rating) : undefined,
      totalRatings: validProduct.product_num_ratings ? parseInt(validProduct.product_num_ratings.toString(), 10) : undefined,
      asin: validProduct.asin
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