import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { parseProductSection } from './utils/sectionParser.ts';
import { formatProductHtml } from './utils/productFormatter.ts';
import { searchAmazonProduct } from './amazon-api.ts';
import { ProcessedContent } from './types/ContentTypes.ts';

export async function processContent(
  content: string,
  associateId: string,
  apiKey: string
): Promise<ProcessedContent> {
  console.log('Processing content with length:', content.length);
  
  const affiliateLinks: ProcessedContent['affiliateLinks'] = [];
  
  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch 3 random blog posts
  const { data: relatedPosts, error: postsError } = await supabase
    .from('blog_posts')
    .select('title, slug')
    .not('content', 'eq', '')
    .lt('published_at', new Date().toISOString())
    .limit(3)
    .order('random()');

  if (postsError) {
    console.error('Error fetching related posts:', postsError);
    throw postsError;
  }

  if (!relatedPosts?.length) {
    console.warn('No related posts found');
    return { content, affiliateLinks };
  }

  console.log('Found related posts:', relatedPosts.length);

  // Replace link placeholders with actual blog post links
  relatedPosts.forEach((post, index) => {
    const placeholder = `[LINK ${index + 1} PLACEHOLDER]`;
    const link = `<a href="/blog/post/${post.slug}" class="text-primary hover:text-primary/90">${post.title}</a>`;
    content = content.replace(placeholder, link);
  });
  
  // Split content into sections and process each
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
          hasImage: !!product.imageUrl
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
      
      console.log('No Amazon product found for:', parsedSection.productName);
      return section;
    } catch (error) {
      console.error('Error processing product:', parsedSection.productName, error);
      return section;
    }
  }));
  
  console.log('Processed all sections, affiliate links found:', affiliateLinks.length);
  return { 
    content: processedSections.join('<hr class="my-8">'),
    affiliateLinks 
  };
}