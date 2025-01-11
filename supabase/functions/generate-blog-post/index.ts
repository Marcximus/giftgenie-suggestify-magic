import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateBlogContent } from "../_shared/blog-content-generator.ts";
import { processContent } from "../_shared/content-processor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Generating blog post for:', title);

    // Get Amazon Associate ID and verify it exists
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');
    if (!associateId) {
      console.error('Amazon Associate ID not configured');
      throw new Error('Amazon Associate ID not configured');
    }

    // Extract price range and topic from title
    const priceMatch = title.match(/under\s+\$(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1]) : 100;
    const topicMatch = title.match(/top\s+(\d+)/i);
    const numProducts = topicMatch ? parseInt(topicMatch[1]) : 5;

    // Extract the main subject
    const subject = title
      .toLowerCase()
      .replace(/top\s+\d+\s+/i, '')
      .replace(/\s+under\s+\$\d+/i, '')
      .trim();

    // Generate initial content
    let content = await generateBlogContent(title, maxPrice, numProducts, subject);

    // Process content to add affiliate links and images
    const { content: processedContent, affiliateLinks } = await processContent(content, associateId);

    // Add responsive text classes
    content = processedContent
      .replace(/<p>/g, '<p class="text-left text-sm md:text-base mb-4">')
      .replace(/<h2>/g, '<h2 class="text-left text-xl md:text-2xl font-bold mt-8 mb-4">')
      .replace(/<h3>/g, '<h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">')
      .replace(/<ul>/g, '<ul class="text-left list-disc pl-6 space-y-2 text-sm md:text-base">')
      .replace(/<ol>/g, '<ol class="text-left list-decimal pl-6 space-y-2 text-sm md:text-base">');

    return new Response(
      JSON.stringify({ 
        content,
        affiliateLinks 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-blog-post function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});