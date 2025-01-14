import { searchAmazonProduct } from './amazon-api.ts';
import type { AmazonProduct } from './types.ts';

export async function processContent(
  content: string,
  associateId: string,
  apiKey: string
): Promise<{ content: string; affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> }> {
  console.log('Processing content with length:', content.length);
  
  const affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> = [];
  
  // First, clean up any existing product images or buttons
  content = content.replace(/View on Amazon\n/g, '');
  
  // Process each product section
  const sections = content.split('<hr class="my-8">');
  console.log('Found sections:', sections.length);
  
  const processedSections = await Promise.all(sections.map(async (section) => {
    const h3Match = section.match(/<h3>([^<]+)<\/h3>/);
    
    if (!h3Match) {
      console.log('No product title found in section, keeping as is');
      return section;
    }
    
    const productName = h3Match[1].trim();
    console.log('Processing product:', productName);
    
    try {
      const product = await searchAmazonProduct(productName, apiKey);
      
      if (product?.asin) {
        console.log('Found Amazon product:', {
          title: product.title,
          asin: product.asin,
          hasImage: !!product.imageUrl
        });

        const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
        affiliateLinks.push({
          productTitle: product.title,
          affiliateLink,
          imageUrl: product.imageUrl
        });

        // Split the section content to insert image and button after the h3 tag
        const [beforeH3, afterH3] = section.split(/<\/h3>/);
        
        if (!beforeH3 || !afterH3) {
          console.warn('Could not split section content properly');
          return section;
        }

        // Reconstruct the section with the product information
        return `${beforeH3}</h3>
          <div class="flex justify-center my-4">
            <img 
              src="${product.imageUrl}" 
              alt="${productName}"
              class="w-64 h-64 object-contain rounded-lg shadow-md" 
              loading="lazy"
            />
          </div>
          <div class="flex justify-center mb-8">
            <a 
              href="${affiliateLink}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm font-medium"
            >
              View on Amazon
            </a>
          </div>${afterH3}`;
      } else {
        console.warn('No Amazon product found for:', productName);
        return section;
      }
    } catch (error) {
      console.error('Error processing product:', productName, error);
      return section;
    }
  }));

  console.log('Processed all sections, affiliate links found:', affiliateLinks.length);

  return { 
    content: processedSections.join('<hr class="my-8">'),
    affiliateLinks 
  };
}