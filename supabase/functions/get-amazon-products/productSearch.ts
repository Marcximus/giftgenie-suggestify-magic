import { AmazonProduct, SearchConfig } from './types.ts';
import { generateFallbackTerms } from './fallbackGenerator.ts';
import { cleanSearchTerm } from './searchUtils.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

// Check if a product title is relevant to the search term
const isRelevantProduct = (productTitle: string, searchTerm: string): boolean => {
  if (!productTitle) return false;
  
  // Convert both to lowercase for case-insensitive comparison
  const normalizedTitle = productTitle.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  
  // Extract key terms from search
  const searchKeywords = normalizedSearch.split(' ')
    .filter(word => word.length > 3) // Only consider substantial words
    .filter(word => !['with', 'and', 'for', 'the', 'team', 'logo'].includes(word)); // Filter common words
  
  // Check if product contains key terms from the search
  // For dog products, if "dog" is in the search term, at least one dog reference should be in the title
  const isDogProduct = normalizedSearch.includes('dog');
  const hasDogReference = normalizedTitle.includes('dog') || 
                          normalizedTitle.includes('canine') || 
                          normalizedTitle.includes('puppy') || 
                          normalizedTitle.includes('pet');
  
  if (isDogProduct && !hasDogReference) {
    console.log('⚠️ Product rejected: Dog product requested but not found in title');
    return false;
  }
  
  // For NFL products, check for team references
  const isNFLProduct = normalizedSearch.includes('nfl');
  const hasNFLReference = normalizedTitle.includes('nfl') || 
                          normalizedTitle.includes('football') || 
                          normalizedTitle.includes('team') || 
                          /patriots|cowboys|eagles|chiefs|49ers|steelers|packers|bears|ravens|giants/i.test(normalizedTitle);
  
  if (isNFLProduct && !hasNFLReference) {
    console.log('⚠️ Product rejected: NFL product requested but not found in title');
    return false;
  }
  
  // If the search is very specific about the product type (bowl, collar, etc)
  const specificProductTypes = ['bowl', 'collar', 'leash', 'bed', 'mug', 'jersey', 'blanket', 'hoodie'];
  const requestedProductType = specificProductTypes.find(type => normalizedSearch.includes(type));
  
  if (requestedProductType && !normalizedTitle.includes(requestedProductType)) {
    console.log(`⚠️ Product rejected: ${requestedProductType} requested but not found in title`);
    // For these specific product types, we'll be more lenient if it's a pet product
    if (isDogProduct && hasDogReference) {
      console.log('🐶 But it is a dog product, so giving it partial relevance');
      // Still allow it if it's at least a dog product when we're looking for dog accessories
    } else {
      return false;
    }
  }
  
  // Check if at least 40% of keywords are in the title (less strict than before)
  const matchingKeywords = searchKeywords.filter(keyword => normalizedTitle.includes(keyword));
  const keywordMatchRatio = searchKeywords.length > 0 ? matchingKeywords.length / searchKeywords.length : 0;
  
  console.log('🔍 Title relevance check:', {
    title: productTitle,
    searchTerm,
    searchKeywords,
    matchingKeywords,
    matchRatio: keywordMatchRatio,
    passes: keywordMatchRatio >= 0.4
  });
  
  return keywordMatchRatio >= 0.4; // Now requiring 40% match instead of 50%
};

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

  // Find the first relevant product instead of just taking the first one
  let relevantProduct = null;
  for (let i = 0; i < Math.min(searchData.data.products.length, 5); i++) {
    const product = searchData.data.products[i];
    const productTitle = product.title || product.product_title;
    
    if (productTitle && isRelevantProduct(productTitle, term)) {
      relevantProduct = product;
      console.log(`✅ Found relevant product at position ${i+1}:`, {
        title: productTitle,
        searchTerm: term
      });
      break;
    }
  }
  
  // If no relevant product was found, return null to try fallbacks
  if (!relevantProduct) {
    console.log('⚠️ No relevant products found in the first 5 results:', {
      attempt,
      strategy,
      searchTerm: term
    });
    return null;
  }
  
  const product = relevantProduct;
  
  // Ensure we get a valid title from the response
  const productTitle = product.title || product.product_title;
  
  if (!productTitle) {
    console.warn('⚠️ Product found but missing title:', {
      attempt,
      strategy,
      searchTerm: term,
      productData: {
        asin: product.asin,
        hasTitle: !!product.title,
        hasProductTitle: !!product.product_title,
        allKeys: Object.keys(product)
      }
    });
  }
  
  const priceValue = product.product_price ? 
    parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : 
    undefined;

  console.log('✅ Found product:', {
    attempt,
    strategy,
    searchTerm: term,
    title: productTitle,
    price: priceValue,
    hasImage: !!product.product_photo,
    rating: product.product_star_rating,
    asin: product.asin
  });

  return {
    title: productTitle || term, // Fallback to search term if no title found
    description: product.product_description || productTitle || term,
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
      console.log('⚠️ No products found with original term, trying without price constraints');
      // Try again without price constraints
      product = await searchWithTerm(cleanedTerm, apiKey, searchConfig, false, 1, 'exact-no-price');
      
      if (!product) {
        console.log('⚠️ Still no products, generating fallback terms');
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
            // Validate that the fallback product is actually relevant to the original search term
            if (isRelevantProduct(product.title, cleanedTerm)) {
              console.log('✅ Found relevant product with fallback term:', { 
                fallbackTerm, 
                originalTerm: cleanedTerm,
                usePriceConstraints,
                priority,
                attempt: attemptNumber,
                productTitle: product.title,
                productPrice: product.price 
              });
              break;
            } else {
              console.log('❌ Fallback product not relevant to original search:', {
                fallbackTerm,
                originalTerm: cleanedTerm,
                productTitle: product.title
              });
              product = null; // Reset product to try next fallback
            }
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
    }

    // If we still don't have a product, try a more generic approach as a last resort
    if (!product) {
      console.log('⚙️ Using last resort generic search');
      // Extract the most important part of the search term
      const genericTerm = cleanedTerm.split(' ')
        .filter(word => word.length > 3)
        .filter(word => !['with', 'and', 'for', 'the', 'team', 'logo'].includes(word.toLowerCase()))
        .slice(0, 2)
        .join(' ');
      
      if (genericTerm && genericTerm !== cleanedTerm) {
        console.log('🔍 Last resort search with:', { genericTerm, withPriceConstraints: false });
        product = await searchWithTerm(genericTerm, apiKey, searchConfig, false, 99, 'last-resort');
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
      
      // Final validation of product title
      if (!product.title) {
        console.warn('⚠️ Final product missing title, using search term as fallback');
        product.title = searchTerm;
      }
      
      // Final relevance check for the original search term
      if (!isRelevantProduct(product.title, searchTerm)) {
        console.warn('⚠️ Final product not relevant to original search term, returning null');
        return null;
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
