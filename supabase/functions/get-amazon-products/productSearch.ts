import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import { parsePriceRange, applyPriceTolerance, validatePriceInRange, extractPrice } from './priceUtils.ts';
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
  console.log('Cleaned search term:', cleanedTerm);

  // Parse and validate price range
  let priceConstraints;
  if (priceRange) {
    const parsedRange = parsePriceRange(priceRange);
    if (parsedRange) {
      // Apply 20% tolerance to price range
      priceConstraints = applyPriceTolerance(parsedRange);
      console.log('Price range with tolerance:', {
        original: parsedRange,
        adjusted: priceConstraints
      });
    } else {
      console.warn('Failed to parse price range:', priceRange);
    }
  }

  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', cleanedTerm);
  url.searchParams.append('country', 'US');
  url.searchParams.append('category_id', 'aps');

  // Add price constraints to the API request
  if (priceConstraints) {
    url.searchParams.append('min_price', priceConstraints.min.toString());
    url.searchParams.append('max_price', priceConstraints.max.toString());
    console.log('Added price constraints to URL:', {
      min: priceConstraints.min,
      max: priceConstraints.max
    });
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
      console.error('Amazon Search API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText
      });
      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Amazon API response:', {
      hasData: !!searchData.data,
      productsCount: searchData.data?.products?.length || 0
    });

    if (!searchData.data?.products?.length) {
      console.log('No products found in search results');
      return null;
    }

    // Filter and validate products
    const validProducts = searchData.data.products
      .map(product => {
        const price = extractPrice(product.product_price);
        if (!price) {
          console.log('Product filtered - no valid price:', product.title);
          return null;
        }

        // Skip products outside the price range
        if (priceConstraints && !validatePriceInRange(price, priceConstraints.min, priceConstraints.max)) {
          console.log('Product filtered - price out of range:', {
            title: product.title,
            price,
            range: priceConstraints
          });
          return null;
        }

        return {
          ...product,
          extractedPrice: price
        };
      })
      .filter(product => product !== null)
      .sort((a, b) => {
        if (!priceConstraints) return 0;
        // Sort by price proximity to target range midpoint
        const midpoint = (priceConstraints.min + priceConstraints.max) / 2;
        return Math.abs(a.extractedPrice - midpoint) - Math.abs(b.extractedPrice - midpoint);
      });

    console.log('Filtered products:', {
      original: searchData.data.products.length,
      filtered: validProducts.length,
      priceRange: priceConstraints
    });

    if (validProducts.length === 0) {
      console.log('No valid products found after filtering');
      return null;
    }

    const product = validProducts[0];
    return {
      title: product.title,
      description: product.product_description || product.title,
      price: product.extractedPrice,
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