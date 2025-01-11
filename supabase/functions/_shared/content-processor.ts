import { searchAmazonProduct, generateAffiliateLink } from "./amazon-product-handler.ts";
import { AmazonProduct } from "./types.ts";

interface ProcessedContent {
  content: string;
  affiliateLinks: Array<{
    productTitle: string;
    affiliateLink: string;
    imageUrl?: string;
  }>;
}

export async function processContent(
  content: string,
  associateId: string
): Promise<ProcessedContent> {
  const productMatches = content.match(/(?<=<h[23]>)[^<]+(?=<\/h[23]>)/g) || [];
  const affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> = [];
  
  console.log('Found product matches:', productMatches);

  for (const productName of productMatches) {
    console.log('Processing product:', productName);
    
    const product = await searchAmazonProduct(productName);
    
    if (product?.asin) {
      console.log('Successfully found Amazon product:', {
        productName,
        asin: product.asin,
        title: product.title,
        imageUrl: product.imageUrl
      });

      const affiliateLink = generateAffiliateLink(product.asin, associateId);
      affiliateLinks.push({
        productTitle: product.title,
        affiliateLink,
        imageUrl: product.imageUrl
      });

      content = await updateContentWithProduct(content, product, affiliateLink, productName);
    } else {
      console.warn('No Amazon product found for:', productName);
      content = content.replace('[PRODUCT_PLACEHOLDER]', '');
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