import { corsHeaders } from './cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { searchAmazonProduct } from './amazon-api.ts';
import { formatProductHtml } from './utils/productFormatter.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function processContent(
  content: string,
  associateId: string,
  rapidApiKey: string
) {
  console.log('Processing content, length:', content.length);
  const sections = content.split('<hr class="my-8">');
  const processedSections = [];
  const affiliateLinks = [];
  const searchFailures = [];
  const productReviews = [];
  let productSectionCount = 0;
  let amazonLookupCount = 0;
  let successfulReplacements = 0;

  for (const section of sections) {
    if (section.includes('<h3>')) {
      productSectionCount++;
      try {
        const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
        if (titleMatch) {
          const searchTerm = titleMatch[1].trim();
          console.log('Processing product section:', searchTerm);
          amazonLookupCount++;
          
          const product = await searchAmazonProduct(searchTerm, rapidApiKey);
          
          if (product && product.asin) {
            console.log('Found product:', {
              title: product.title,
              asin: product.asin,
              hasRating: !!product.rating
            });

            const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
            affiliateLinks.push({
              title: product.title,
              url: affiliateLink,
              asin: product.asin
            });

            // Store review data if available
            if (product.rating && product.totalRatings) {
              productReviews.push({
                title: product.title,
                rating: product.rating,
                totalRatings: product.totalRatings,
                asin: product.asin
              });
            }

            // Split section to preserve content before and after the h3 tag
            const [beforeH3, afterH3] = section.split('</h3>');
            const productHtml = formatProductHtml(product, affiliateLink, beforeH3, afterH3);
            processedSections.push(productHtml);
            successfulReplacements++;
            
          } else {
            console.warn('No product found for:', searchTerm);
            searchFailures.push({
              term: searchTerm,
              error: 'No product found'
            });
            processedSections.push(section);
          }
        } else {
          processedSections.push(section);
        }
      } catch (error) {
        console.error('Error processing product section:', error);
        searchFailures.push({
          term: section.match(/<h3>(.*?)<\/h3>/)?.[1] || 'Unknown',
          error: error.message
        });
        processedSections.push(section);
      }
    } else {
      processedSections.push(section);
    }
  }

  console.log('Processing summary:', {
    productSections: productSectionCount,
    amazonLookups: amazonLookupCount,
    successfulReplacements,
    affiliateLinksCount: affiliateLinks.length,
    reviewsCollected: productReviews.length
  });

  return {
    content: processedSections.join('<hr class="my-8">'),
    affiliateLinks,
    searchFailures,
    productReviews,
    processingStatus: {
      product_sections: productSectionCount,
      amazon_lookups: amazonLookupCount,
      successful_replacements: successfulReplacements
    }
  };
}