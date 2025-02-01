import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { cleanSearchTerm } from './searchUtils.ts';
import { parsePriceRange, extractPrice } from './priceUtils.ts';
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

  const cleanedTerm = cleanSearchTerm(searchTerm);
  console.log('Cleaned search term:', cleanedTerm);

  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', cleanedTerm);
  url.searchParams.append('country', 'US');
  url.searchParams.append('sort_by', 'RELEVANCE');

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

    console.log('Starting product filtering with:', {
      totalProducts: searchData.data.products.length,
      priceConstraints
    });

    // Filter products by basic validation and blacklist
    let validProducts = searchData.data.products.filter(product => {
      console.log('\nEvaluating product:', {
        title: product?.title,
        price: product?.product_price,
        hasAsin: !!product?.asin
      });

      if (!product || !product.title) {
        console.log('Product filtered out - Invalid product data');
        return false;
      }

      // Check if the product title contains any blacklisted terms
      const blacklistedTerms = ['cancel subscription', 'guide', 'manual', 'how to'];
      const hasBlacklistedTerm = blacklistedTerms.some(term => 
        product.title.toLowerCase().includes(term.toLowerCase())
      );
      
      if (hasBlacklistedTerm) {
        console.log('Product filtered out - contains blacklisted term:', product.title);
        return false;
      }

      console.log('Product passed all filters:', product.title);
      return true;
    });

    console.log('Filtering results:', {
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