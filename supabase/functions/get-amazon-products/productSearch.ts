
import { AmazonProduct, SearchConfig } from './types.ts';
import { generateFallbackTerms } from './fallbackGenerator.ts';
import { cleanSearchTerm } from './searchUtils.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

const searchWithTerm = async (
  term: string, 
  apiKey: string,
  config: SearchConfig,
  usePriceConstraints: boolean,
  attempt: number = 1,
  strategy: string = 'primary'
): Promise<AmazonProduct | null> => {
  console.log('🔍 Search attempt details:', {
    attempt,
    strategy,
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
    console.log('💰 Price constraints applied:', {
      minPrice: config.minPrice,
      maxPrice: config.maxPrice,
      searchTerm: term
    });
  }

  console.log('🌐 Making API request:', {
    attempt,
    strategy,
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
      attempt,
      strategy,
      searchTerm: term,
      status: searchResponse.status,
      statusText: searchResponse.statusText
    });
    throw new Error(`Amazon API error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  console.log('📦 API Response:', {
    attempt,
    strategy,
    searchTerm: term,
    totalProducts: searchData.data?.products?.length || 0,
    hasResults: !!searchData.data?.products?.length,
    firstProductTitle: searchData.data?.products?.[0]?.title || 'No product found'
  });

  if (!searchData.data?.products?.length) {
    console.log('⚠️ No products found:', {
      attempt,
      strategy,
      searchTerm: term,
      priceConstraints: usePriceConstraints
    });
    return null;
  }

  const product = searchData.data.products[0];
  const priceValue = product.product_price ? 
    parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : 
    undefined;

  // Log full product detail to debug title issues
  console.log('✅ Found product details:', {
    attempt,
    strategy,
    searchTerm: term,
    title: product.title,
    productTitle: product.product_title,
    price: priceValue,
    hasImage: !!product.product_photo,
    rating: product.product_star_rating,
    asin: product.asin,
    allKeys: Object.keys(product)
  });

  // Try to get the most accurate title, using multiple potential field names
  // The API may return the title in different fields depending on the response
  const productTitle = product.product_title || product.title || term;

  return {
    title: productTitle, // Use the more reliable product_title field if available
    description: product.product_description || productTitle,
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
    priceRange,
    timestamp: new Date().toISOString()
  });

  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    console.error('❌ Invalid search term:', { searchTerm });
    throw new Error('Search term is required and must be a non-empty string');
  }

  const cleanedTerm = cleanSearchTerm(searchTerm);
  console.log('🧹 Cleaned search term:', {
    original: searchTerm,
    cleaned: cleanedTerm,
    difference: searchTerm !== cleanedTerm ? 'Terms differ' : 'No change needed'
  });

  const searchConfig: SearchConfig = {
    minPrice: priceRange?.min ?? 1,
    maxPrice: priceRange?.max ?? 1000,
    country: 'US',
    categoryId: 'aps'
  };

  try {
    // First try with exact search term
    console.log('🎯 Attempting exact search:', {
      term: cleanedTerm,
      withPriceConstraints: true,
      attempt: 1
    });
    
    let product = await searchWithTerm(cleanedTerm, apiKey, searchConfig, true, 1, 'exact');
    
    if (!product) {
      console.log('⚠️ No products found with original term, generating fallback terms');
      const fallbackTerms = generateFallbackTerms(cleanedTerm);
      console.log('🔄 Generated fallback terms:', {
        originalTerm: cleanedTerm,
        fallbackOptions: fallbackTerms.map(t => ({
          searchTerm: t.searchTerm,
          usePriceConstraints: t.usePriceConstraints,
          priority: t.priority
        }))
      });
      
      for (const { searchTerm: fallbackTerm, usePriceConstraints, priority } of fallbackTerms) {
        const attemptNumber = fallbackTerms.findIndex(t => t.searchTerm === fallbackTerm) + 2;
        console.log('🔄 Trying fallback search:', { 
          fallbackTerm, 
          usePriceConstraints,
          priority,
          attempt: attemptNumber,
          totalFallbacks: fallbackTerms.length
        });
        
        product = await searchWithTerm(
          fallbackTerm, 
          apiKey, 
          searchConfig, 
          usePriceConstraints, 
          attemptNumber,
          `fallback-priority-${priority}`
        );
        
        if (product) {
          console.log('✅ Found product with fallback term:', { 
            fallbackTerm, 
            usePriceConstraints,
            priority,
            attempt: attemptNumber,
            productTitle: product.title,
            productPrice: product.price 
          });
          
          // If we found a product with a fallback search, but the title doesn't match the original search term,
          // overwrite it with the original search term to maintain consistency with what was requested
          if (fallbackTerm !== cleanedTerm && !product.title.toLowerCase().includes(cleanedTerm.toLowerCase())) {
            console.log('📝 Updating product title to maintain consistency with search term:', {
              originalTitle: product.title,
              newTitle: searchTerm,
              reason: 'Fallback search product title does not match original search term'
            });
            product.title = searchTerm;
          }
          
          break;
        } else {
          console.log('❌ No product found with fallback term:', {
            fallbackTerm,
            usePriceConstraints,
            priority,
            attempt: attemptNumber
          });
        }
      }
    }

    if (!product) {
      console.log('❌ No products found after trying all fallback terms');
    } else {
      console.log('✅ Search successful:', {
        originalTerm: searchTerm,
        finalProduct: {
          title: product.title,
          price: product.price,
          asin: product.asin
        }
      });
      
      // Final check: ensure the product title is not empty
      if (!product.title || product.title.trim() === '') {
        console.log('⚠️ Empty product title detected, using search term instead');
        product.title = searchTerm;
      }
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
