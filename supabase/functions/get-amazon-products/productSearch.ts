import { AmazonProduct, SearchConfig } from './types.ts';
import { generateFallbackTerms } from './fallbackGenerator.ts';
import { cleanSearchTerm } from './searchUtils.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

const searchWithTerm = async (
  term: string, 
  apiKey: string,
  config: SearchConfig,
  usePriceConstraints: boolean
): Promise<AmazonProduct | null> => {
  console.log('🔍 Starting search with term:', {
    searchTerm: term,
    usePriceConstraints,
    priceRange: usePriceConstraints ? { 
      minPrice: config.minPrice, 
      maxPrice: config.maxPrice 
    } : 'No price constraints'
  });

  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  url.searchParams.append('query', term);
  url.searchParams.append('country', config.country || 'US');
  url.searchParams.append('category_id', config.categoryId || 'aps');
  url.searchParams.append('sort_by', 'RELEVANCE');
  
  if (usePriceConstraints && config.minPrice && config.maxPrice) {
    url.searchParams.append('min_price', config.minPrice.toString());
    url.searchParams.append('max_price', config.maxPrice.toString());
    console.log('💰 Adding price constraints:', {
      minPrice: config.minPrice,
      maxPrice: config.maxPrice
    });
  }

  console.log('🌐 Making API request:', {
    fullUrl: url.toString(),
    headers: {
      'X-RapidAPI-Host': RAPIDAPI_HOST,
      // Mask API key in logs
      'X-RapidAPI-Key': `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    }
  });

  const searchResponse = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    }
  });

  if (!searchResponse.ok) {
    console.error('❌ Amazon Search API error:', {
      status: searchResponse.status,
      statusText: searchResponse.statusText
    });
    throw new Error(`Amazon API error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  console.log('📦 API Response:', {
    totalProducts: searchData.data?.products?.length || 0,
    hasResults: !!searchData.data?.products?.length,
    firstProductTitle: searchData.data?.products?.[0]?.title || 'No product found'
  });

  if (!searchData.data?.products?.length) {
    console.log('⚠️ No products found for term:', term);
    return null;
  }

  const product = searchData.data.products[0];
  const priceValue = product.product_price ? 
    parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : 
    undefined;

  console.log('✅ Found product:', {
    title: product.title,
    price: priceValue,
    hasImage: !!product.product_photo,
    rating: product.product_star_rating,
    asin: product.asin
  });

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
};

export const searchProducts = async (
  searchTerm: string,
  apiKey: string,
  priceRange?: { min?: number; max?: number }
): Promise<AmazonProduct | null> => {
  console.log('🎯 Starting product search:', {
    originalSearchTerm: searchTerm,
    priceRange
  });

  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    console.error('❌ Invalid search term:', { searchTerm });
    throw new Error('Search term is required and must be a non-empty string');
  }

  const cleanedTerm = cleanSearchTerm(searchTerm);
  console.log('🧹 Cleaned search term:', {
    original: searchTerm,
    cleaned: cleanedTerm
  });

  const searchConfig: SearchConfig = {
    minPrice: priceRange?.min ?? 1,
    maxPrice: priceRange?.max ?? 1000,
    country: 'US',
    categoryId: 'aps'
  };

  try {
    // First try with exact search term
    console.log('🎯 Attempting exact search with cleaned term:', cleanedTerm);
    let product = await searchWithTerm(cleanedTerm, apiKey, searchConfig, true);
    
    if (!product) {
      console.log('⚠️ No products found with original term, generating fallback terms');
      const fallbackTerms = generateFallbackTerms(cleanedTerm);
      console.log('🔄 Generated fallback terms:', fallbackTerms);
      
      for (const { searchTerm: fallbackTerm, usePriceConstraints, priority } of fallbackTerms) {
        console.log('🔄 Trying fallback search:', { 
          fallbackTerm, 
          usePriceConstraints,
          priority,
          attempt: fallbackTerms.findIndex(t => t.searchTerm === fallbackTerm) + 1,
          totalFallbacks: fallbackTerms.length
        });
        
        product = await searchWithTerm(fallbackTerm, apiKey, searchConfig, usePriceConstraints);
        
        if (product) {
          console.log('✅ Found product with fallback term:', { 
            fallbackTerm, 
            usePriceConstraints,
            priority,
            productTitle: product.title,
            productPrice: product.price 
          });
          break;
        } else {
          console.log('❌ No product found with fallback term:', {
            fallbackTerm,
            usePriceConstraints,
            priority
          });
        }
      }
    }

    if (!product) {
      console.log('❌ No products found after trying all fallback terms');
    }

    return product;

  } catch (error) {
    console.error('❌ Error in Amazon product search:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
    throw error;
  }
};