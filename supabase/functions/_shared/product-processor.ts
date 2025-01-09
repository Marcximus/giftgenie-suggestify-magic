import { searchAmazonProduct } from './amazon-api.ts';
import { generateCustomDescription } from './openai.ts';
import { GiftSuggestion } from './types.ts';

export async function processGiftSuggestion(suggestion: string): Promise<GiftSuggestion> {
  try {
    console.log('Processing suggestion:', suggestion);
    const product = await searchAmazonProduct(suggestion);
    
    if (product) {
      const customDescription = await generateCustomDescription(
        product.title || suggestion,
        product.description || suggestion
      );

      // Create a more detailed reason for the suggestion
      const reason = `This ${product.title} is a perfect match because it's a high-quality product that fits within your budget and aligns with the recipient's interests. It has ${product.rating ? `an average rating of ${product.rating} stars from ${product.totalRatings} reviews` : 'great reviews'} on Amazon.`;

      return {
        title: product.title || suggestion,
        description: customDescription.replace(/['"]/g, ''),
        priceRange: `${product.price?.currency || 'USD'} ${product.price?.current_price || '0'}`,
        reason: reason.replace(/['"]/g, ''),
        amazon_asin: product.asin,
        amazon_url: product.asin ? `https://www.amazon.com/dp/${product.asin}` : undefined,
        amazon_price: product.price?.current_price,
        amazon_image_url: product.main_image,
        amazon_rating: product.rating,
        amazon_total_ratings: product.ratings_total,
        search_query: suggestion
      };
    }
    
    return {
      title: suggestion,
      description: suggestion,
      priceRange: 'Price not available',
      reason: 'This item matches your requirements.',
      search_query: suggestion
    };
  } catch (error) {
    console.error('Error processing suggestion:', suggestion, error);
    return {
      title: suggestion,
      description: suggestion,
      priceRange: 'Price not available',
      reason: 'This item matches your requirements.',
      search_query: suggestion
    };
  }
}