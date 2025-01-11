import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from "../_shared/amazon-api.ts";
import { generateCustomDescription } from "../_shared/openai.ts";

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
          {
            role: "system",
            content: `You are a professional blog content writer specializing in gift recommendations. Create engaging, SEO-optimized content that follows these guidelines:

1. Start with an engaging introduction (2-3 paragraphs)
2. Include a "Why These Gifts Are Perfect" section
3. Include a "How to Choose the Right Gift" section
4. For product recommendations:
   - Create EXACTLY ${numItems} product recommendations (no more, no less)
   - Number each recommendation (1. Product Name, 2. Product Name, etc.)
   - Make product titles VERY specific (include brand names and models)
   - Use humor and light sarcasm where appropriate
   - Include emojis for visual appeal (1-2 per section)
   - Write 200-300 words per product
5. End with a conclusion and call-to-action
6. Format with proper HTML tags
7. Keep paragraphs short and readable
8. Include relevant keywords naturally

IMPORTANT: 
- Format product titles as: <h3>[EXACT PRODUCT NAME WITH BRAND]</h3>
- Make product names VERY specific for accurate Amazon matching
- Focus on premium/high-quality items
- Use emojis sparingly but effectively
- Maintain a fun, engaging tone throughout`
          },
          {
            role: "user",
            content: `Create a blog post about: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate blog content');
    }

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
            asin: product.asin
          });

          const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
          
          // Store affiliate link info
          affiliateLinks.push({
            productTitle: product.title,
            affiliateLink,
            imageUrl: product.imageUrl
          });

          // Add product image with specific dimensions
          const imageHtml = product.imageUrl ? `
            <div class="flex justify-center my-4">
              <img src="${product.imageUrl}" 
                   alt="${product.title}" 
                   class="rounded-lg shadow-md w-36 h-36 object-contain"
                   loading="lazy" />
            </div>` : '';

          // Replace product title and add affiliate link with price and reviews
          const priceInfo = product.price ? 
            `<p class="text-left text-sm text-muted-foreground mb-2">💰 Current price: ${product.currency} ${product.price}</p>` : '';
          
          const reviewInfo = product.rating ? 
            `<p class="text-left text-sm text-muted-foreground mb-4">⭐ Rating: ${product.rating.toFixed(1)} out of 5 stars (${product.totalRatings?.toLocaleString()} reviews)</p>` : '';

          const titleReplacement = `
            <h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
              ${product.title}
              <div class="mt-2">
                <a href="${affiliateLink}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
                  View on Amazon
                </a>
              </div>
            </h3>
            ${imageHtml}
            ${priceInfo}
            ${reviewInfo}`;

          content = content.replace(productMatch, titleReplacement);
        } else {
          console.warn('No Amazon product found for:', productName);
        }
      } catch (error) {
        console.error('Error processing product:', productName, error);
      }
    }

    // Add responsive text classes
    content = content
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