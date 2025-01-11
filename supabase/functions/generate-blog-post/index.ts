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
            content: `You are a witty, entertaining blog writer specializing in gift recommendations. Create engaging, detailed content (2000-3000 words) that follows this structure:

1. Start with an attention-grabbing introduction using humor and emojis
2. Include these sections with emojis in headings:
   - "Why These Gifts Are Perfect 🎯"
   - "How to Choose the Right Gift 🤔"
   - "Our Top Picks 🎁"
3. For product recommendations:
   - Create H3 headings with VERY specific product names (include brand names and models)
   - Use witty descriptions with light sarcasm where appropriate
   - Include practical scenarios with humor
   - Add emojis throughout the content naturally
4. End with a funny conclusion and call-to-action

IMPORTANT FORMATTING RULES:
- Format product titles exactly as: <h3>[EXACT PRODUCT NAME WITH BRAND]</h3>
- Make product names VERY specific for accurate Amazon matching
- Write 300-400 words per product
- Include 6-8 product recommendations
- Focus on premium/high-quality items
- Use humor and sarcasm tastefully
- Add relevant emojis to enhance readability
- Keep paragraphs short and mobile-friendly

TONE GUIDELINES:
- Be conversational and entertaining
- Use witty observations
- Include playful pop culture references
- Add humorous "what not to buy" examples
- Share funny gift-giving scenarios
- Keep sarcasm light and good-natured`
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
            asin: product.asin,
            price: product.price,
            rating: product.rating,
            totalRatings: product.totalRatings
          });

          const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
          
          // Store affiliate link info
          affiliateLinks.push({
            productTitle: product.title,
            affiliateLink,
            imageUrl: product.imageUrl
          });

          // Add product image with mobile-optimized dimensions
          const imageHtml = product.imageUrl ? `
            <div class="flex justify-center my-4">
              <img src="${product.imageUrl}" 
                   alt="${product.title}" 
                   class="rounded-lg shadow-md w-[150px] h-[150px] object-contain"
                   loading="lazy" />
            </div>` : '';

          // Add price and rating information
          const ratingStars = '⭐'.repeat(Math.round(product.rating || 0));
          const priceInfo = product.price ? 
            `<p class="text-left text-sm text-muted-foreground mb-2">💰 Current price: ${product.currency} ${product.price}</p>` : '';
          const ratingInfo = product.rating ? 
            `<p class="text-left text-sm text-muted-foreground mb-4">${ratingStars} ${product.rating}/5 (${product.totalRatings?.toLocaleString()} reviews)</p>` : '';

          // Replace product title and add affiliate link with all info
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
            ${ratingInfo}`;

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