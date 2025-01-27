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
      productsCount: searchData.data?.products?.length || 0,
      categories: detectedCategories,
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

    // Filter products by price and relevance
    let validProducts = searchData.data.products.filter(product => {
      // Check if the product title contains any blacklisted terms
      const blacklistedTerms = ['cancel subscription', 'guide', 'manual', 'how to'];
      const hasBlacklistedTerm = blacklistedTerms.some(term => 
        product.title.toLowerCase().includes(term)
      );
      
      if (hasBlacklistedTerm) {
        console.log('Product filtered out - contains blacklisted term:', product.title);
        return false;
      }

      // Validate price if constraints exist
      if (priceConstraints) {
        const price = extractPrice(product.product_price);
        if (!price || !validatePriceInRange(price, priceConstraints.min, priceConstraints.max)) {
          console.log('Product filtered out - price out of range:', {
            title: product.title,
            price,
            constraints: priceConstraints
          });
          return false;
        }
      }

      return true;
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