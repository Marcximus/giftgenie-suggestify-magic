import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from "../_shared/amazon-api.ts";
import { generateCustomDescription } from "../_shared/openai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const AMAZON_ASSOCIATE_ID = Deno.env.get('AMAZON_ASSOCIATE_ID');

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

1. Start with an engaging introduction (2-3 paragraphs)
   - Use humor and relatable scenarios
   - Include 1-2 relevant emojis per paragraph
   - Make it fun and engaging to read

2. Include these sections with emojis:
   - "Why These Gifts Will Make Their Day 🎁"
   - "How to Choose the Perfect Gift 🎯"
   - "Pro Tips for Gift-Giving Success 💡"

3. For product recommendations:
   - Create EXACTLY ${numItems} recommendations
   - Format each recommendation as a countdown:
     * Start with "[PRODUCT_PLACEHOLDER]\\nNo. ${numItems}:" for the first item
     * Count down to "No. 1:" for the final item
   - Write 150-200 words per product
   - Include these elements for each product:
     * Key features and benefits
     * Real-world usage scenarios
     * Why it makes a great gift
     * Who would love this gift and why
   - Add 1-2 emojis per product section
   - Make product titles VERY specific with brand names

4. End with:
   - A brief conclusion
   - A call-to-action
   - Final emoji

Style Guidelines:
- Use a conversational, friendly tone
- Keep paragraphs short and punchy
- Use emojis naturally, not forced
- Make product names VERY specific for accurate Amazon matching
- Focus on premium/high-quality items
- Write at least 1500 words total`
          },
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    let content = data.choices[0].message.content;
    const affiliateLinks = [];

    // Extract product titles from the content
    const productMatches = content.match(/No\. \d+: ([^\n]+)/g) || [];
    console.log('Found product matches:', productMatches.length);

    // Process each product
    for (const productMatch of productMatches) {
      const productName = productMatch.replace(/No\. \d+: /, '');
      console.log('Processing product:', productName);

      try {
        const product = await searchAmazonProduct(productName, RAPIDAPI_KEY);
        
        if (product?.asin) {
          console.log('Found Amazon product:', {
            title: product.title,
            asin: product.asin
          });

          const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${AMAZON_ASSOCIATE_ID}`;
          
          affiliateLinks.push({
            productTitle: product.title,
            affiliateLink,
            imageUrl: product.imageUrl
          });

          // Generate a custom product description
          const customDescription = await generateCustomDescription(
            product.title,
            product.description || ''
          );

          // Add product image and details
          const productHtml = `
            <div class="product-section mb-8">
              <h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
                ${productMatch}
                <div class="mt-2">
                  <a href="${affiliateLink}" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
                    View on Amazon
                  </a>
                </div>
              </h3>
              ${product.imageUrl ? `
                <div class="flex justify-center my-4">
                  <img src="${product.imageUrl}" 
                       alt="${product.title}" 
                       class="rounded-lg shadow-md w-[150px] h-[150px] object-contain"
                       loading="lazy" />
                </div>
              ` : ''}
              ${product.price ? `
                <p class="text-left text-sm text-muted-foreground mb-2">
                  💰 Current price: ${product.currency} ${product.price}
                </p>
              ` : ''}
              ${product.rating ? `
                <p class="text-left text-sm text-muted-foreground mb-4">
                  ⭐ Rating: ${product.rating.toFixed(1)} out of 5 stars 
                  ${product.totalRatings ? `(${product.totalRatings.toLocaleString()} reviews)` : ''}
                </p>
              ` : ''}
              <p class="text-left text-sm md:text-base mb-4">${customDescription}</p>
            </div>`;

          // Replace the original product section with the enhanced version
          content = content.replace(
            `[PRODUCT_PLACEHOLDER]\n${productMatch}`,
            productHtml
          );
        }
      } catch (error) {
        console.error('Error processing product:', productName, error);
      }
    }

    // Add responsive text classes
    content = content
      .replace(/<p>/g, '<p class="text-left text-sm md:text-base mb-4">')
      .replace(/<h2>/g, '<h2 class="text-left text-xl md:text-2xl font-bold mt-8 mb-4">')
      .replace(/<ul>/g, '<ul class="text-left list-disc pl-6 space-y-2 text-sm md:text-base">')
      .replace(/<ol>/g, '<ol class="text-left list-decimal pl-6 space-y-2 text-sm md:text-base">');

    return new Response(
      JSON.stringify({ content, affiliateLinks }),
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