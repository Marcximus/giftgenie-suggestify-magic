import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from "../_shared/amazon-api.ts";
import { generateCustomDescription } from "../_shared/openai.ts";
import { buildBlogPrompt } from "./openaiPrompt.ts";
import { formatProductHtml } from "./productFormatter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Generating blog post for:', title);

    // Extract number of items from title (e.g., "Top 10" -> 10)
    const numItemsMatch = title.match(/\b(\d+)\b/);
    const numItems = numItemsMatch ? parseInt(numItemsMatch[1]) : 5;
    console.log('Number of items to generate:', numItems);

    // Get Amazon Associate ID
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');
    if (!associateId) {
      throw new Error('Amazon Associate ID not configured');
    }

    // Generate initial blog post structure using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          buildBlogPrompt(numItems),
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}`
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    let content = data.choices[0].message.content;
    const affiliateLinks = [];

    // Extract product titles from H3 tags
    const productMatches = content.match(/<h3>([^<]+)<\/h3>/g) || [];
    console.log('Found product matches:', productMatches.length);

    // Process each product
    for (const productMatch of productMatches) {
      const productName = productMatch.replace(/<\/?h3>/g, '');
      console.log('Processing product:', productName);

      try {
        if (!RAPIDAPI_KEY) {
          throw new Error('RAPIDAPI_KEY not configured');
        }

        const product = await searchAmazonProduct(productName, RAPIDAPI_KEY);
        
        if (product?.asin) {
          console.log('Found Amazon product:', {
            title: product.title,
            asin: product.asin,
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

          // Generate a custom product description
          const customDescription = await generateCustomDescription(product.title, product.description);
          console.log('Generated custom description:', customDescription);

          const formattedHtml = formatProductHtml(
            {
              title: product.title,
              imageUrl: product.imageUrl,
              price: product.price,
              currency: product.currency,
              rating: product.rating,
              totalRatings: product.totalRatings,
              description: customDescription
            },
            affiliateLink
          );

          content = content.replace(productMatch, formattedHtml);
        } else {
          console.warn('No Amazon product found for:', productName);
        }
      } catch (error) {
        console.error('Error processing product:', productName, error);
      }
    }

    // Add responsive text classes with improved spacing
    content = content
      .replace(/<p>/g, '<p class="text-left text-sm md:text-base mb-6">')
      .replace(/<h2>/g, '<h2 class="text-left text-xl md:text-2xl font-bold mt-12 mb-6">')
      .replace(/<h3>/g, '<h3 class="text-left text-lg md:text-xl font-semibold mt-8 mb-4">')
      .replace(/<ul>/g, '<ul class="text-left list-disc pl-6 space-y-3 mb-6">')
      .replace(/<ol>/g, '<ol class="text-left list-decimal pl-6 space-y-3 mb-6">');

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