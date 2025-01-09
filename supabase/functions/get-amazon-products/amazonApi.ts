const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

export async function searchAmazonProduct(searchTerm: string, apiKey: string) {
  console.log('Searching for product:', searchTerm);

  const searchParams = new URLSearchParams({
    query: encodeURIComponent(searchTerm.trim()),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  try {
    // First, search for products
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
      throw new Error(`Amazon Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search response:', searchData);

    if (!searchData.data?.products?.length) {
      throw new Error('No products found');
    }

    const product = searchData.data.products[0];
    const asin = product.asin;

    if (!asin) {
      throw new Error('Invalid product data: No ASIN found');
    }

    // Get detailed product information using ASIN
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
      throw new Error(`Amazon Details API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Product details response:', detailsData);

    if (detailsData.data) {
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