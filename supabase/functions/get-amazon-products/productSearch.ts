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
  console.log('Cleaned search term:', cleanedTerm);
  
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
        hasImage: !!searchData.data.products[0].product_photo,
        hasAsin: !!searchData.data.products[0].asin
      } : null
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
        if (!price) {
          console.log('Product filtered out - no valid price:', product.title);
          return false;
        }
        const isValid = validatePriceInRange(price, priceConstraints.min, priceConstraints.max);
        if (!isValid) {
          console.log('Product filtered out - price out of range:', {
            title: product.title,
            price,
            min: priceConstraints.min,
            max: priceConstraints.max
          });
        }
        return isValid;
      });

      console.log('Filtered products by price range:', {
        original: searchData.data.products.length,
        filtered: validProducts.length,
        priceRange: priceConstraints
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
      hasImage: !!product.product_photo,
      hasAsin: !!product.asin
    });

    if (!product.asin || !product.product_photo) {
      console.warn('Product missing required data:', {
        title: product.title,
        hasAsin: !!product.asin,
        hasImage: !!product.product_photo
      });
      return null;
    }

    return formatProduct(product);
  } catch (error) {
    console.error('Error in Amazon product search:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
    throw error;
  }
};

const formatProduct = (product: any): AmazonProduct => {
  const formattedProduct = {
    title: product.title,
    description: product.product_description || product.title,
    price: extractPrice(product.product_price),
    currency: 'USD',
    imageUrl: product.product_photo || product.thumbnail,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
    asin: product.asin
  };

  console.log('Formatted product:', {
    title: formattedProduct.title,
    hasPrice: formattedProduct.price !== undefined,
    hasImage: !!formattedProduct.imageUrl,
    hasAsin: !!formattedProduct.asin
  });

  return formattedProduct;
};