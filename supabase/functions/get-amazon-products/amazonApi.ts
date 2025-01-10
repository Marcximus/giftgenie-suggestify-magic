const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

export async function searchAmazonProduct(searchTerm: string, apiKey: string) {
  console.log('Initial search attempt for:', searchTerm);

  async function performSearch(term: string) {
    // Clean the search term before sending to API
    const cleanedTerm = term
      .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
      .replace(/&/g, 'and') // Replace & with 'and'
      .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    console.log('Searching with cleaned term:', cleanedTerm);

    const searchParams = new URLSearchParams({
      query: cleanedTerm,
      country: 'US',
      category_id: 'aps',
      sort_by: 'RELEVANCE'
    });

    const searchResponse = await fetch(
      `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    if (!searchResponse.ok) {
      if (searchResponse.status === 429) {
        throw new Error('rate limit exceeded');
      }
      throw new Error(`Amazon Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search response:', searchData);
    return searchData;
  }

  async function getProductDetails(asin: string) {
    const detailsResponse = await fetch(
      `https://${RAPIDAPI_HOST}/product-details?asin=${asin}&country=US`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    if (!detailsResponse.ok) {
      console.warn(`Failed to get product details for ASIN ${asin}, status: ${detailsResponse.status}`);
      return null;
    }

    const detailsData = await detailsResponse.json();
    console.log('Product details response:', detailsData);
    return detailsData;
  }

  try {
    // Remove specific model numbers, sizes, and colors from search term
    const genericSearchTerm = searchTerm
      .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
      .replace(/\b(?:edition|version|series)\b/gi, '') // Remove common suffixes
      .replace(/-.*$/, '') // Remove anything after a hyphen
      .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '') // Remove sizes
      .trim();

    console.log('Attempting search with generic term:', genericSearchTerm);
    
    // First attempt with generic search term
    let searchData = await performSearch(genericSearchTerm);
    
    // If no products found, try with even more simplified search
    if (!searchData.data?.products?.length) {
      // Split the search term and remove common descriptive words
      const words = genericSearchTerm.split(' ')
        .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
        .filter(word => word.length > 2);
      
      // Try with first two main words
      if (words.length > 1) {
        const briefSearch = words.slice(0, 2).join(' ');
        console.log('Attempting brief search with:', briefSearch);
        searchData = await performSearch(briefSearch);
      }
      
      // If still no results, try with just the first word
      if (!searchData.data?.products?.length && words.length > 0) {
        const singleWordSearch = words[0];
        console.log('Final attempt with single word:', singleWordSearch);
        searchData = await performSearch(singleWordSearch);
      }
    }

    // If still no products found, return null
    if (!searchData.data?.products?.length) {
      console.log('No products found with any search attempt');
      return null;
    }

    const product = searchData.data.products[0];
    const asin = product.asin;

    if (!asin) {
      console.warn('Invalid product data: No ASIN found');
      return null;
    }

    // Get detailed product information
    const detailsData = await getProductDetails(asin);

    if (detailsData?.data) {
      return {
        title: detailsData.data.product_title || product.title,
        description: detailsData.data.product_description || product.product_description || product.title,
        price: parsePrice(detailsData.data.product_price) || parsePrice(detailsData.data.product_original_price),
        currency: detailsData.data.currency || 'USD',
        imageUrl: detailsData.data.product_photo || detailsData.data.product_photos?.[0] || product.thumbnail,
        rating: detailsData.data.product_star_rating ? parseFloat(detailsData.data.product_star_rating) : undefined,
        totalRatings: detailsData.data.product_num_ratings ? parseInt(detailsData.data.product_num_ratings, 10) : undefined,
        asin: asin,
      };
    }

    // Fallback to search data if details request fails
    return {
      title: product.title,
      description: product.product_description || product.title,
      price: parsePrice(product.price?.current_price),
      currency: product.price?.currency || 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
      asin: asin,
    };
  } catch (error) {
    console.error('Error in searchAmazonProduct:', error);
    throw error;
  }
}

function parsePrice(priceStr: string | null | undefined): number | undefined {
  if (!priceStr) return undefined;
  
  // Remove currency symbol and any commas
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  
  return isNaN(price) ? undefined : price;
}