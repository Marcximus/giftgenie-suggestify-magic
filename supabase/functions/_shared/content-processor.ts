import { searchAmazonProduct } from './amazon-api.ts';
import { parseProductSection } from './utils/sectionParser.ts';
import { formatProductHtml } from './utils/productFormatter.ts';
import { ProcessedContent } from './types/ContentTypes.ts';

export async function processContent(
  content: string,
  associateId: string,
  apiKey: string
): Promise<ProcessedContent> {
  console.log('Processing content with length:', content.length);
  
  const affiliateLinks: ProcessedContent['affiliateLinks'] = [];
  content = content.replace(/View on Amazon\n/g, '');
  
  const sections = content.split('<hr class="my-8">');
  console.log('Found sections:', sections.length);
  
  const processedSections = await Promise.all(sections.map(async (section) => {
    const parsedSection = parseProductSection(section);
    if (!parsedSection) return section;
    
    try {
      console.log('Searching for product:', parsedSection.productName);
      const product = await searchAmazonProduct(parsedSection.productName, apiKey);
      
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
        
        return formatProductHtml(
          product,
          affiliateLink,
          parsedSection.beforeH3,
          parsedSection.afterH3
        );
      }
      
      return section;
    } catch (error) {
      console.error('Error processing product:', parsedSection.productName, error);
      return section;
    }
  }));
  
  const footerLink = `
    <div class="flex justify-center mt-12 mb-8">
      <a 
        href="/" 
        class="perfect-gift-button"
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