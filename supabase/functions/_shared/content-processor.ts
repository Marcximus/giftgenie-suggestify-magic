import { searchAmazonProduct } from './amazon-api.ts';
import { AmazonProduct } from './types.ts';

export async function processContent(
  content: string,
  associateId: string,
  apiKey: string
): Promise<{ content: string; affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> }> {
  // Find all product titles between <h3> tags
  const productMatches = content.match(/<h3>([^<]+)<\/h3>/g) || [];
  const affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> = [];
  
  console.log('Found product matches:', productMatches);

  for (const productMatch of productMatches) {
    // Extract the product name from the <h3> tag
    const productName = productMatch.replace(/<\/?h3>/g, '').trim();
    console.log('Processing product:', productName);
    
    try {
      const product = await searchAmazonProduct(productName, apiKey);
      
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

        // Create the product section HTML with Amazon data
        const productSection = `
          <h3>${product.title}</h3>
          <div class="flex justify-center my-4">
            <img src="${product.imageUrl}" 
                 alt="${product.title}" 
                 class="w-72 sm:w-96 md:w-[500px] h-72 sm:h-96 md:h-[500px] object-contain rounded-lg shadow-md" 
                 loading="lazy" />
          </div>
          ${product.price ? `<p class="text-left text-sm text-muted-foreground mb-2">Current price: ${product.currency || 'USD'} ${product.price}</p>` : ''}
          ${product.rating ? `<p class="text-left text-sm text-muted-foreground mb-4">Rating: ${product.rating.toFixed(1)} stars${product.totalRatings ? ` • ${product.totalRatings.toLocaleString()} reviews` : ''}</p>` : ''}
          <div class="flex justify-center mt-4 mb-8">
            <a href="${affiliateLink}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="amazon-button inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
              View on Amazon
            </a>
          </div>`;

        // Replace the original product section with the new one
        const sectionRegex = new RegExp(
          `<h3>${productName}</h3>[^]*?(?=<h3>|$)`
        );
        content = content.replace(sectionRegex, productSection);
      } else {
        console.warn('No Amazon product found for:', productName);
      }
    } catch (error) {
      console.error('Error processing product:', productName, error);
    }
  }

  return { content, affiliateLinks };
}