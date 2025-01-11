import { searchAmazonProduct } from './amazon-product-handler.ts';
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
          imageUrl: product.imageUrl,
          price: product.price,
          rating: product.rating,
          totalRatings: product.totalRatings
        });

        const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
        affiliateLinks.push({
          productTitle: product.title,
          affiliateLink,
          imageUrl: product.imageUrl
        });

        // Add product image and info with specific dimensions
        const productInfo = `
          <div class="flex flex-col items-center my-6">
            <img src="${product.imageUrl}" 
                 alt="${product.title}" 
                 class="rounded-lg shadow-md w-36 md:w-40 object-contain mb-4" 
                 loading="lazy" />
            <div class="product-info w-full">
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">${product.currency} ${product.price}</span>
                <div class="flex items-center gap-1">
                  <span class="text-yellow-400">★</span>
                  <span>${product.rating?.toFixed(1) || 'N/A'}</span>
                  <span class="text-muted-foreground">(${product.totalRatings?.toLocaleString() || '0'})</span>
                </div>
              </div>
              <a href="${affiliateLink}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="inline-block w-full text-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors text-sm md:text-base">
                View on Amazon
              </a>
            </div>
          </div>`;
        
        content = content.replace('[PRODUCT_PLACEHOLDER]', productInfo);
        
        // Replace product title and add affiliate link
        const titlePattern = new RegExp(`<h[23]>${productName}</h[23]>`);
        const titleReplacement = `<h3 class="text-left text-lg md:text-xl font-semibold mt-8 mb-4">${product.title}</h3>`;
        
        content = content.replace(titlePattern, titleReplacement);
      } else {
        console.warn('No Amazon product found for:', productName);
      }
    } catch (error) {
      console.error('Error processing product:', productName, error);
    }
  }

  return { content, affiliateLinks };
}

async function updateContentWithProduct(
  content: string,
  product: AmazonProduct,
  affiliateLink: string,
  originalTitle: string
): Promise<string> {
  // Add product image with specific dimensions
  const imageReplacement = `<div class="flex justify-center my-4">
    <img src="${product.imageUrl}" 
         alt="${product.title}" 
         class="rounded-lg shadow-md w-[150px] h-[150px] object-contain" 
         loading="lazy" />
   </div>`;
  
  content = content.replace('[PRODUCT_PLACEHOLDER]', imageReplacement);
  
  // Replace product title and add affiliate link with clear CTA
  const titlePattern = new RegExp(`<h[23]>${originalTitle}</h[23]>`);
  const titleReplacement = `<h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
     ${product.title}
     <div class="mt-2">
       <a href="${affiliateLink}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
         View on Amazon
       </a>
     </div>
   </h3>`;
  
  content = content.replace(titlePattern, titleReplacement);

  // Add price information if available
  if (product.price) {
    const priceInfo = `<p class="text-left text-sm text-muted-foreground mb-4">Current price: ${product.currency} ${product.price}</p>`;
    content = content.replace(
      new RegExp(`(${product.title}.*?</h3>)`),
      `$1\n${priceInfo}`
    );
  }

  return content;
}
