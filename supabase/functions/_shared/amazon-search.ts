import { corsHeaders } from './cors.ts';
import { AmazonProduct } from './types.ts';

const extractPriceRange = (priceRange?: string) => {
  if (!priceRange) return null;
  
  // Clean the input string
  const cleanInput = priceRange.replace(/[$,]/g, '').trim();
  
  // Handle single number with "around" or similar
  if (cleanInput.match(/^(?:around|about|approximately|~)?\s*\d+$/i)) {
    const number = parseFloat(cleanInput.replace(/[^\d.]/g, ''));
    if (!isNaN(number)) {
      return {
        min: number * 0.8,
        max: number * 1.2
      };
    }
  }
  
  // Handle range format
  const parts = cleanInput.split('-').map(part => parseFloat(part.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return {
      min: parts[0] * 0.8, // Apply 20% margin
      max: parts[1] * 1.2
    };
  }
  
  return null;
};

export async function searchAmazonProducts(keyword: string, priceRange?: string): Promise<AmazonProduct | null> {
  console.log('Searching with term:', keyword, 'Price range:', priceRange);
  
  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const range = extractPriceRange(priceRange);
    console.log('Extracted price range:', range);

    const makeSearchRequest = async (searchTerm: string) => {
      const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
      url.searchParams.append('query', encodeURIComponent(searchTerm));
      url.searchParams.append('country', 'US');
      url.searchParams.append('sort_by', 'RELEVANCE');
      
      // Add price range parameters if available
      if (range) {
        url.searchParams.append('min_price', Math.floor(range.min).toString());
        url.searchParams.append('max_price', Math.ceil(range.max).toString());
      }

      console.log('Making API request to:', url.toString());

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        console.error(`API error for keyword ${searchTerm}:`, response.status);
        return null;
      }

      return await response.json();
    };

    // First attempt with full keyword
    let searchData = await makeSearchRequest(keyword);
    
    if (!searchData?.data?.products?.length) {
      console.log('No product found, trying simplified search');
      // Try a simplified search by taking the first few words
      const simplifiedKeyword = keyword.split(' ').slice(0, 3).join(' ');
      if (simplifiedKeyword !== keyword) {
        console.log('Attempting simplified search with:', simplifiedKeyword);
        searchData = await makeSearchRequest(simplifiedKeyword);
      }
    }

    if (!searchData?.data?.products?.length) {
      console.log('No products found in Amazon API response');
      return null;
    }

    const product = searchData.data.products[0];
    
    // Extract and validate required fields
    const formattedProduct: AmazonProduct = {
      title: product.product_title || keyword,
      image_url: product.product_photo || null,
      price: product.product_price ? 
        parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : 
        undefined,
      rating: product.product_star_rating ? 
        parseFloat(product.product_star_rating) : 
        undefined,
      total_ratings: product.product_num_ratings ? 
        parseInt(product.product_num_ratings.toString(), 10) : 
        undefined,
      url: product.product_url,
      asin: product.asin
    };

    // Validate minimum required fields
    if (!formattedProduct.title || (!formattedProduct.image_url && !formattedProduct.asin)) {
      console.error(`Missing required fields for keyword ${keyword}`);
      return null;
    }

    return formattedProduct;
  } catch (error) {
    console.error(`Error searching for keyword ${keyword}:`, error);
    return null;
  }
}