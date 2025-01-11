import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { generateBlogContent } from "../_shared/blog-content-generator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, occasion } = await req.json();
    console.log('Generating blog content for:', { title, occasion });

    // Generate the blog content
    const content = await generateBlogContent(title, 100, 10, occasion);
    console.log('Generated content length:', content.length);

    // Process the content to extract product information and add affiliate links
    const processedContent = await processContent(content);
    console.log('Processed content with affiliate links');

    return new Response(
      JSON.stringify({
        content: processedContent.content,
        affiliateLinks: processedContent.affiliateLinks
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in generate-blog-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

async function processContent(content: string) {
  const productMatches = content.match(/\[PRODUCT_PLACEHOLDER\](.*?)(?=\[PRODUCT_PLACEHOLDER\]|$)/gs) || [];
  const affiliateLinks: Array<{ productTitle: string; affiliateLink: string; imageUrl?: string }> = [];
  let processedContent = content;

  for (const match of productMatches) {
    try {
      const titleMatch = match.match(/\#\d+\:\s*(.*?)(?=\n|$)/);
      if (titleMatch && titleMatch[1]) {
        const productTitle = titleMatch[1].trim();
        const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');
        
        // Add to affiliate links array
        affiliateLinks.push({
          productTitle,
          affiliateLink: `https://www.amazon.com/s?k=${encodeURIComponent(productTitle)}&tag=${associateId}`,
        });
      }
    } catch (error) {
      console.error('Error processing product match:', error);
    }
  }

  return {
    content: processedContent,
    affiliateLinks
  };
}