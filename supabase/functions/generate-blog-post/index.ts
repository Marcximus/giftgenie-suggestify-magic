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
            content: `You are a witty, entertaining blog writer specializing in gift recommendations. Create engaging, humorous content that follows these guidelines:

1. Start with an engaging introduction (3-4 paragraphs)
   - Use humor and light sarcasm
   - Include relevant emojis (1-2 per paragraph)
   - Make it relatable and fun to read

2. Include these sections with emojis:
   - "Why These Gifts Will Make Their Day 🎁"
   - "How to Choose the Perfect Gift 🎯"
   - "Pro Tips for Gift-Giving Success 💡"

3. For product recommendations:
   - Create EXACTLY ${numItems} recommendations (no more, no less)
   - Number each recommendation clearly (1. Product Name, 2. Product Name, etc.)
   - Write 400-500 words per product
   - Include these elements for each product:
     * Detailed features and benefits
     * Real-world usage scenarios
     * Why it makes a great gift
     * Personal anecdotes or humorous observations
     * Who would love this gift and why
     * Creative ways to present or gift wrap it
   - Add 2-3 emojis per product section
   - Make product titles VERY specific with brand names

4. End with:
   - A funny conclusion
   - A humorous call-to-action
   - Final emoji-filled sign-off

Style Guidelines:
- Use a conversational, friendly tone
- Include pop culture references when relevant
- Add playful commentary about each product
- Use emojis naturally, not forced
- Make sarcastic (but kind) observations
- Keep paragraphs short and punchy

IMPORTANT: 
- Format product titles as: <h3>[EXACT PRODUCT NAME WITH BRAND]</h3>
- Make product names VERY specific for accurate Amazon matching
- Focus on premium/high-quality items
- Write at least 3000 words total
- Maintain humor throughout
- Use emojis effectively but don't overdo it`
          },
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}`
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
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

          // Generate a custom product description
          const customDescription = await generateCustomDescription(product.title, product.description);
          console.log('Generated custom description:', customDescription);

          // Add product image with specific dimensions
          const imageHtml = product.imageUrl ? `
            <div class="flex justify-center my-4">
              <img src="${product.imageUrl}" 
                   alt="${product.title}" 
                   class="rounded-lg shadow-md w-[150px] h-[150px] object-contain"
                   loading="lazy" />
            </div>` : '';

          // Format price with currency
          const priceDisplay = product.price ? 
            `<p class="text-left text-sm text-muted-foreground mb-2">💰 Current price: ${product.currency} ${product.price}</p>` : '';
          
          // Format rating and review count
          const reviewInfo = product.rating ? 
            `<p class="text-left text-sm text-muted-foreground mb-4">
              ⭐ Rating: ${product.rating.toFixed(1)} out of 5 stars 
              ${product.totalRatings ? `(${product.totalRatings.toLocaleString()} reviews)` : ''}
            </p>` : '';

          // Add the custom description
          const descriptionHtml = customDescription ? 
            `<p class="text-left text-sm md:text-base mb-4">${customDescription}</p>` : '';

          // Replace product title and add affiliate link with price, reviews, and description
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
            ${priceDisplay}
            ${reviewInfo}
            ${descriptionHtml}`;

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