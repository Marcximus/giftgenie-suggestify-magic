import { makeApiRequest, buildSearchParams } from './amazonClient.ts';
import { AmazonProduct } from '../types.ts';
import { isLikelyAccessory } from '../utils/productUtils.ts';

export async function searchProducts(
  searchTerm: string,
  apiKey: string,
  options: {
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<AmazonProduct | null> {
  console.log('Searching products for:', searchTerm, options);
  
  const searchParams = buildSearchParams(searchTerm, options);
  const searchData = await makeApiRequest('search', searchParams, apiKey);

  if (!searchData.data?.products?.length) {
    console.log('No products found for search term:', searchTerm);
    return null;
  }

  // Filter out accessories and get the first valid product
  const validProduct = searchData.data.products.find(product => 
    product.asin && !isLikelyAccessory(product.title)
  );

  if (!validProduct) {
    console.log('No valid products found after filtering accessories');
    return null;
  }

  return {
    title: validProduct.title,
    description: validProduct.product_description || validProduct.title,
    price: validProduct.price?.current_price,
    currency: validProduct.price?.currency || 'USD',
    imageUrl: validProduct.product_photo || validProduct.thumbnail,
    rating: validProduct.product_star_rating ? parseFloat(validProduct.product_star_rating) : undefined,
    totalRatings: validProduct.product_num_ratings ? parseInt(validProduct.product_num_ratings.toString(), 10) : undefined,
    asin: validProduct.asin,
  };
}