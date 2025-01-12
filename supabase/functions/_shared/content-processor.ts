import { searchAmazonProduct } from './amazon-api.ts';
import { AmazonProduct } from './types.ts';

export async function processContent(
  content: string,
  associateId: string
): Promise<{ content: string; affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> }> {
  const productMatches = content.match(/(?<=<h[23]>)[^<]+(?=<\/h[23]>)/g) || [];
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
          `<h[23]>${productName}</h[23]>\\s*<p>[^<]*</p>`
        );
        
        // Create the new product section with Amazon info
        const simplifiedTitle = product.title.split(' ').slice(0, 7).join(' ').trim();
        const newProductSection = `<h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
           ${simplifiedTitle}
           <div class="mt-2">
             <a href="${affiliateLink}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
               View on Amazon
             </a>
           </div>
         </h3>
         <div class="flex justify-center my-4">
           <img src="${product.imageUrl}" 
                alt="${simplifiedTitle}" 
                class="w-72 sm:w-96 md:w-[500px] h-72 sm:h-96 md:h-[500px] object-contain rounded-lg shadow-md" 
                loading="lazy" />
         </div>
         ${product.price ? `<p class="text-left text-sm text-muted-foreground mb-4">Current price: USD ${product.price}</p>` : ''}`;

        // Replace only the h3 tag, keeping the following paragraph
        content = content.replace(/<h[23]>[^<]*<\/h[23]>/, newProductSection);

      } else {
        console.warn('No Amazon product found for:', productName);
      }
    } catch (error) {
      console.error('Error processing product:', productName, error);
    }
  }

  return { content, affiliateLinks };
}
