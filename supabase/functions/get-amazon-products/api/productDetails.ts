import { makeApiRequest } from './amazonClient.ts';
import { AmazonProduct } from '../types.ts';

export async function getProductDetails(
  asin: string,
  apiKey: string
): Promise<AmazonProduct | null> {
  console.log('Fetching details for ASIN:', asin);
  
  const params = new URLSearchParams({
    asin,
    country: 'US'
  });

  try {
    const detailsData = await makeApiRequest('product-details', params, apiKey);

    if (!detailsData.data) {
      console.warn(`No details found for ASIN ${asin}`);
      return null;
    }

    const price = detailsData.data.product_price ? 
      parseFloat(detailsData.data.product_price.replace(/[$,]/g, '')) : undefined;

    const rating = detailsData.data.product_star_rating ? 
      parseFloat(detailsData.data.product_star_rating) : undefined;

    const totalRatings = detailsData.data.product_num_ratings ? 
      parseInt(detailsData.data.product_num_ratings.toString(), 10) : undefined;

    return {
      title: detailsData.data.product_title,
      description: detailsData.data.product_description,
      price,
      currency: detailsData.data.currency || 'USD',
      imageUrl: detailsData.data.product_photo || detailsData.data.product_photos?.[0],
      rating,
      totalRatings,
      asin,
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}