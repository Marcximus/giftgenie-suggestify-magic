import { searchAmazonProduct } from './amazon-api.ts';
import { AmazonProduct } from './types.ts';

export async function processContent(
  content: string,
  associateId: string,
  apiKey: string
): Promise<{ content: string; affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> }> {
  console.log('Processing content with length:', content.length);
  
  // Extract product titles from H3 tags
  const productMatches = content.match(/<h3>([^<]+)<\/h3>/g) || [];
  const affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> = [];
  
  console.log('Found product matches:', productMatches);

  // Process each product section
  for (const productMatch of productMatches) {
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

        // Extract the section content
        const sectionRegex = new RegExp(
          `<h3>${productName}</h3>([\\s\\S]*?)(?=<h3>|$)`,
          'g'
        );
        
        const sectionMatch = content.match(sectionRegex);
        const sectionContent = sectionMatch ? sectionMatch[0].split('</h3>')[1].trim() : '';

        // Create the product section with proper HTML structure
        const productSection = `
          <div class="product-section my-8 p-6 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm">
            <h3 class="text-xl font-semibold mb-4">${product.title}</h3>
            ${product.imageUrl ? `
              <div class="flex justify-center my-4">
                <img 
                  src="${product.imageUrl}" 
                  alt="${product.title}" 
                  class="w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px] h-auto object-contain rounded-lg shadow-md" 
                  loading="lazy"
                />
              </div>
            ` : ''}
            ${product.price ? `
              <p class="text-left text-sm text-muted-foreground mb-2">
                Current price: ${product.currency || 'USD'} ${product.price}
              </p>
            ` : ''}
            ${product.rating ? `
              <p class="text-left text-sm text-muted-foreground mb-4">
                Rating: ${product.rating.toFixed(1)} stars${product.totalRatings ? ` • ${product.totalRatings.toLocaleString()} reviews` : ''}
              </p>
            ` : ''}
            <div class="product-content my-4">
              ${sectionContent}
            </div>
            <div class="flex justify-center mt-4 mb-2">
              <a 
                href="${affiliateLink}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="amazon-button"
              >
                View on Amazon
              </a>
            </div>
          </div>`;

        // Replace the original product section with the new one
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