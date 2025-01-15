import { searchAmazonProduct } from './amazon-api.ts';
 
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
          hasImage: !!product.imageUrl,
          rating: product.rating,
          totalRatings: product.totalRatings
        });
        const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
        affiliateLinks.push({
          productTitle: product.title,
          affiliateLink,
          imageUrl: product.imageUrl
        });
        
        const [beforeH3, afterH3] = section.split(/<\/h3>/);
        
        if (!beforeH3 || !afterH3) {
          console.warn('Could not split section content properly');
          return section;
        }

        // Add review information with improved styling
        const reviewInfo = product.rating ? `
          <div class="flex flex-col items-center gap-2 my-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
              ${Array.from({ length: 5 }, (_, i) => 
                `<span class="text-yellow-400 text-lg">
                  ${i < Math.floor(product.rating) ? '★' : (i < product.rating ? '★' : '☆')}
                </span>`
              ).join('')}
              <span class="font-medium text-lg">${product.rating.toFixed(1)}</span>
            </div>
            ${product.totalRatings ? `
              <div class="text-sm text-gray-600">
                Based on ${product.totalRatings.toLocaleString()} customer reviews
              </div>
            ` : ''}
          </div>` : '';
        
        return `${beforeH3}</h3>
          <div class="flex flex-col items-center my-8 sm:my-10">
            <div class="relative w-full max-w-2xl mb-6">
              <img 
                src="${product.imageUrl}" 
                alt="${productName}"
                class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
                loading="lazy"
              />
            </div>
            ${reviewInfo}
            <div class="mt-4">
              <a 
                href="${affiliateLink}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="amazon-button"
              >
                View on Amazon
              </a>
            </div>
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
  
  // Add the "Get the Perfect Gift" link with improved design
  const footerLink = `
    <div class="text-center mt-12 mb-8">
      <a 
        href="/" 
        class="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white rounded-md transition-all duration-300 bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 hover:opacity-90 hover:scale-105"
      >
        Get the Perfect Gift
      </a>
    </div>
  `;
  
  console.log('Processed all sections, affiliate links found:', affiliateLinks.length);
  return { 
    content: processedSections.join('<hr class="my-8">') + footerLink,
    affiliateLinks 
  };
}