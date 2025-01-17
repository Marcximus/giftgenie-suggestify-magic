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

  for (const section of sections) {
    if (section.includes('<h3>')) {
      try {
        const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
        if (titleMatch) {
          const searchTerm = titleMatch[1].trim();
          console.log('Processing product section:', searchTerm);
          
          const product = await searchAmazonProduct(searchTerm, rapidApiKey);
          
          if (product) {
            console.log('Found product:', {
              title: product.title,
              hasPrice: !!product.price,
              hasRating: !!product.rating,
              hasImage: !!product.imageUrl
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
            
          } else {
            console.warn('No product found for:', searchTerm);
            searchFailures.push({
              term: searchTerm,
              error: 'No product found'
            });
            processedSections.push(section);
          }
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

  console.log('Content processing summary:', {
    sectionsProcessed: sections.length,
    productsFound: affiliateLinks.length,
    reviewsCollected: productReviews.length,
    searchFailures: searchFailures.length
  });

  return {
    content: processedSections.join('<hr class="my-8">'),
    affiliateLinks,
    searchFailures,
    productReviews
  };
}