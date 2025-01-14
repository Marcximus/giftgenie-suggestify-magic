import { searchAmazonProduct } from './amazon-api.ts';
import type { AmazonProduct } from './types.ts';

export async function processContent(
  content: string,
  associateId: string,
  apiKey: string
): Promise<{ content: string; affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> }> {
  console.log('Processing content with length:', content.length);
  
  // First, let's clean up any duplicate product sections
  content = content.replace(/View on Amazon\n/g, '');
  
  // Extract product sections with surrounding content
  const sections = content.split(/(?=<h3>)/);
  
  // Process each section
  const processedSections = await Promise.all(sections.map(async (section) => {
    const h3Match = section.match(/<h3>([^<]+)<\/h3>/);
    
    if (!h3Match) return section; // Not a product section, return as is
    
    const productName = h3Match[1].trim();
    console.log('Processing product section:', productName);
    
    try {
      const product = await searchAmazonProduct(productName, apiKey);
      
      if (product?.asin) {
        const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
        
        // Extract the description paragraphs that follow the h3
        const paragraphs = section
          .split(/<h3>[^<]+<\/h3>/)[1]  // Get everything after the h3
          .split(/(?=<h3>)/)[0]         // Get everything before the next h3
          .trim();

        // Create the new product section
        return `
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
    ${paragraphs}
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
      }
      
      console.warn('No Amazon product found for:', productName);
      return section; // Return original section if no product found
      
    } catch (error) {
      console.error('Error processing product:', productName, error);
      return section; // Return original section if processing fails
    }
  }));

  return { 
    content: processedSections.join('\n'),
    affiliateLinks: [] // We'll populate this later if needed
  };
}