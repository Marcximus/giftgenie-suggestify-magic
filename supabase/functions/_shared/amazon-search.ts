import { corsHeaders } from './cors.ts';
import { AmazonProduct } from './types.ts';

export async function searchAmazonProducts(keyword: string): Promise<AmazonProduct | null> {
  console.log('Searching with term:', keyword);
  
  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(keyword)}&country=US`;
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error(`API error for keyword ${keyword}:`, response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data?.data?.products?.[0]) {
      console.log('No product found, trying simplified search');
      // Try a simplified search by taking the first few words
      const simplifiedKeyword = keyword.split(' ').slice(0, 3).join(' ');
      if (simplifiedKeyword !== keyword) {
        return searchAmazonProducts(simplifiedKeyword);
      }
      return null;
    }

    const product = data.data.products[0];
    
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