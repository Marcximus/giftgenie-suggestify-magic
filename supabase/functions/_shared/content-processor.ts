import { searchAmazonProduct } from './amazon-api.ts';
import { AmazonProduct } from './types.ts';

export async function processContent(
  content: string,
  associateId: string
): Promise<{ content: string; affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> }> {
  const productMatches = content.match(/(?<=<h3>)[^<]+(?=<\/h3>)/g) || [];
  const affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> = [];
  
  console.log('Found product matches:', productMatches);

  for (const productName of productMatches) {
    console.log('Processing product:', productName);
    
    try {
      const product = await searchAmazonProduct(productName);
      
      if (product?.asin) {
        console.log('Successfully found Amazon product:', {
          productName,
          asin: product.asin,
          title: product.title,
          imageUrl: product.imageUrl
        });

        const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
        affiliateLinks.push({
          productTitle: product.title,
          affiliateLink,
          imageUrl: product.imageUrl
        });

        // Find the entire product section including the title and following paragraph
        const productSectionRegex = new RegExp(
          `<h3>${productName}</h3>\\s*<p>[^<]*</p>`
        );
        
        const formattedHtml = formatProductHtml(
          {
            title: product.title,
            imageUrl: product.imageUrl,
            price: product.price?.toString(),
            currency: 'USD',
            rating: product.rating?.toString(),
            totalRatings: product.totalRatings?.toString(),
            description: product.description
          },
          affiliateLink
        );

        content = content.replace(productSectionRegex, formattedHtml);
      } else {
        console.warn('No Amazon product found for:', productName);
      }
    } catch (error) {
      console.error('Error processing product:', productName, error);
    }
  }

  return { content, affiliateLinks };
}