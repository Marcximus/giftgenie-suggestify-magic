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

  for (const section of sections) {
    if (section.includes('<h3>')) {
      try {
        const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
        if (titleMatch) {
          const searchTerm = titleMatch[1];
          console.log('Searching for product:', searchTerm);
          
          const product = await searchAmazonProduct(searchTerm, rapidApiKey);
          
          if (product) {
            const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
            affiliateLinks.push({
              title: product.title,
              url: affiliateLink,
              asin: product.asin
            });
            
            const productHtml = formatProductHtml(product, affiliateLink);
            const processedSection = section.replace(
              /<h3>.*?<\/h3>/,
              productHtml
            );
            processedSections.push(processedSection);
          } else {
            console.warn('No product found for:', searchTerm);
            processedSections.push(section);
          }
        }
      } catch (error) {
        console.error('Error processing product section:', error);
        processedSections.push(section);
      }
    } else if (section.includes('[LINK')) {
      try {
        // Fetch 3 random published blog posts
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('title, slug')
          .not('published_at', 'is', null)
          .order('RANDOM()')  // Fixed: Using correct PostgreSQL random ordering
          .limit(3);

        if (error) {
          console.error('Error fetching related posts:', error);
          processedSections.push(section);
        } else {
          let processedSection = section;
          posts.forEach((post, index) => {
            processedSection = processedSection.replace(
              `[LINK ${index + 1} PLACEHOLDER]`,
              `<a href="/blog/post/${post.slug}" class="text-primary hover:underline">${post.title}</a>`
            );
          });
          processedSections.push(processedSection);
        }
      } catch (error) {
        console.error('Error processing related posts section:', error);
        processedSections.push(section);
      }
    } else {
      processedSections.push(section);
    }
  }

  return {
    content: processedSections.join('<hr class="my-8">'),
    affiliateLinks
  };
}