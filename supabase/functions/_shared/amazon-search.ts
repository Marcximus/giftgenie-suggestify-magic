import { corsHeaders } from './cors.ts';
import { AmazonProduct } from './types.ts';

const extractPriceRange = (priceRange?: string) => {
  if (!priceRange) return null;
  
  console.log('Extracting price range from:', priceRange);
  
  // Clean the input string
  const cleanInput = priceRange.replace(/[$,]/g, '').trim();
  
  // Handle single number with "around" or similar
  if (cleanInput.match(/^(?:around|about|approximately|~)?\s*\d+$/i)) {
    const number = parseFloat(cleanInput.replace(/[^\d.]/g, ''));
    if (!isNaN(number)) {
      console.log(`Found 'around' price: ${number}, applying 20% margin`);
      return {
        min: Math.floor(number * 0.8),
        max: Math.ceil(number * 1.2)
      };
    }
  }
  
  // Handle range format
  const parts = cleanInput.split('-').map(part => parseFloat(part.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    console.log(`Found price range: ${parts[0]}-${parts[1]}, applying 20% margin`);
    return {
      min: Math.floor(parts[0] * 0.8), // Apply 20% margin
      max: Math.ceil(parts[1] * 1.2)
    };
  }
  
  // Extract numbers from text
  const numbers = cleanInput.match(/\d+/g);
  if (numbers && numbers.length >= 2) {
    const [min, max] = numbers.map(n => parseFloat(n));
    if (!isNaN(min) && !isNaN(max)) {
      console.log(`Extracted price range from text: ${min}-${max}, applying 20% margin`);
      return {
        min: Math.floor(min * 0.8),
        max: Math.ceil(max * 1.2)
      };
    }
  }
  
  console.log('No valid price range found');
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
      url.searchParams.append('category_id', 'aps');
      url.searchParams.append('sort_by', 'RELEVANCE');
      
      // Add price range parameters if available
      if (range) {
        url.searchParams.append('min_price', range.min.toString());
        url.searchParams.append('max_price', range.max.toString());
        console.log(`Adding price range to request: $${range.min}-$${range.max}`);
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

      const data = await response.json();
      console.log('API response:', data);
      return data;
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

    // Filter products by price range if specified
    let products = searchData.data.products;
    if (range) {
      products = products.filter(product => {
        const price = product.product_price ? 
          parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : null;
        
        if (price === null) return false;
        
        const inRange = price >= range.min && price <= range.max;
        console.log(`Product "${product.product_title}" price: $${price}, in range: ${inRange}`);
        return inRange;
      });

      if (products.length === 0) {
        console.log('No products found within price range');
        return null;
      }
    }

    const product = products[0];
    
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

    console.log('Formatted product:', formattedProduct);

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