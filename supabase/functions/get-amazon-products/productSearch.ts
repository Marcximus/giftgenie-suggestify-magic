import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import { parsePriceRange, validatePriceInRange, extractPrice } from './priceUtils.ts';
import type { AmazonProduct } from './types.ts';

// Map common gift categories to Amazon browse node IDs
const CATEGORY_MAP = {
  skincare: '11060451',
  beauty: '3760911',
  music: '5174',
  electronics: '172282',
  books: '283155',
  fashion: '7141123011',
  sports: '3375251',
  toys: '165793011',
  home: '1055398',
  kitchen: '284507',
  office: '1064954',
  pets: '2619533011'
};

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

  const cleanedTerm = cleanSearchTerm(searchTerm);
  console.log('Cleaned search term:', cleanedTerm);

  // Parse price range and apply 20% tolerance
  let minPrice, maxPrice;
  if (priceRange) {
    const range = parsePriceRange(priceRange);
    if (range) {
      // Apply 20% tolerance to min and max prices
      minPrice = Math.floor(range.min * 0.8); // Allow 20% below minimum
      maxPrice = Math.ceil(range.max * 1.2); // Allow 20% above maximum
      console.log('Price range with tolerance:', { original: range, adjusted: { min: minPrice, max: maxPrice }});
    }
  }

  // Detect relevant categories from the search term
  const detectedCategories = Object.entries(CATEGORY_MAP)
    .filter(([category]) => 
      searchTerm.toLowerCase().includes(category) ||
      cleanedTerm.toLowerCase().includes(category)
    )
    .map(([_, nodeId]) => nodeId);

  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', cleanedTerm);
  url.searchParams.append('country', 'US');
  
  // Use detected category if available, otherwise use a general gifts category
  if (detectedCategories.length > 0) {
    url.searchParams.append('category_id', detectedCategories[0]);
  } else {
    url.searchParams.append('category_id', 'aps');
  }

  // Add price constraints to the API request
  if (minPrice !== undefined) {
    url.searchParams.append('min_price', minPrice.toString());
  }
  if (maxPrice !== undefined) {
    url.searchParams.append('max_price', maxPrice.toString());
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
        statusText: searchResponse.statusText,
        headers: Object.fromEntries(searchResponse.headers.entries())
      });

      if (searchResponse.status === 429) {
        throw new Error('Rate limit exceeded for Amazon API');
      }
      
      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Amazon API response:', {
      hasData: !!searchData.data,
      productsCount: searchData.data?.products?.length || 0,
      priceRange: { min: minPrice, max: maxPrice }
    });

    if (!searchData.data?.products?.length) {
      console.log('No products found in Amazon API response');
      return null;
    }

    // Filter and sort products by price match
    const validProducts = searchData.data.products
      .filter(product => {
        const price = extractPrice(product.product_price);
        if (!price) {
          console.log('Product filtered - no valid price:', product.title);
          return false;
        }

        // Skip products outside the price range (with tolerance)
        if (minPrice !== undefined && maxPrice !== undefined) {
          const isInRange = price >= minPrice && price <= maxPrice;
          if (!isInRange) {
            console.log('Product filtered - price out of range:', {
              title: product.title,
              price,
              range: { min: minPrice, max: maxPrice }
            });
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by price proximity to target range midpoint
        if (minPrice !== undefined && maxPrice !== undefined) {
          const midpoint = (minPrice + maxPrice) / 2;
          const priceA = extractPrice(a.product_price) || 0;
          const priceB = extractPrice(b.product_price) || 0;
          return Math.abs(priceA - midpoint) - Math.abs(priceB - midpoint);
        }
        return 0;
      });

    console.log('Filtered products:', {
      original: searchData.data.products.length,
      filtered: validProducts.length,
      priceRange: { min: minPrice, max: maxPrice }
    });

    if (validProducts.length === 0) {
      console.log('No valid products found after filtering');
      return null;
    }

    const product = validProducts[0];
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
  } catch (error) {
    console.error('Error in Amazon product search:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
    throw error;
  }
};