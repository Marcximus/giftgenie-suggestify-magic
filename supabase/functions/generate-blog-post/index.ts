import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from "../_shared/amazon-api.ts";
import { generateCustomDescription } from "../_shared/openai.ts";

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

    const numItemsMatch = title.match(/\b(\d+)\b/);
    const numItems = numItemsMatch ? parseInt(numItemsMatch[1]) : 5;
    console.log('Number of items to generate:', numItems);

    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');
    if (!associateId) {
      throw new Error('Amazon Associate ID not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a witty, entertaining blog writer specializing in gift recommendations. Create engaging content that follows these guidelines:

1. Start with a BRIEF introduction (2 paragraphs max)
   - Keep it light and fun
   - Include 1-2 relevant emojis
   - Make it relatable

2. Include these SHORT sections:
   - "Why These Gifts Are Perfect 🎁" (2-3 sentences)
   - "Quick Tips for Choosing 💡" (3-4 bullet points)

3. For product recommendations:
   - Create EXACTLY ${numItems} recommendations
   - Format as countdown: "No. ${numItems}:" to "No. 1:"
   - Write 200-250 words per product
   - Include for each product:
     * Specific features and benefits
     * Real usage examples
     * Who would love it and why
     * Price-value proposition
   - Add 1-2 emojis per product
   - Make product titles VERY specific

4. End with:
   - A brief conclusion
   - A call-to-action
   - Final emoji

Style Guidelines:
- Keep paragraphs short (2-3 sentences)
- Use conversational tone
- Add occasional humor
- Format product titles as: <h3>No. [NUMBER]: [EXACT PRODUCT NAME WITH BRAND]</h3>
- Make product names VERY specific for accurate Amazon matching
- Focus on premium items
- Write at least 2000 words total
- COUNT DOWN from ${numItems} to 1`
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

    const data = await response.json();
    let content = data.choices[0].message.content;
    const affiliateLinks = [];

    const productMatches = content.match(/<h3>([^<]+)<\/h3>/g) || [];
    console.log('Found product matches:', productMatches.length);

    for (const productMatch of productMatches) {
      const productName = productMatch.replace(/<\/?h3>/g, '');
      console.log('Processing product:', productName);

      try {
        const product = await searchAmazonProduct(productName);
        
        if (product?.asin) {
          console.log('Found Amazon product:', {
            title: product.title,
            asin: product.asin
          });

          const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
          
          affiliateLinks.push({
            productTitle: product.title,
            affiliateLink,
            imageUrl: product.imageUrl
          });

          const customDescription = await generateCustomDescription(product.title, product.description);

          const imageHtml = product.imageUrl ? `
            <div class="flex justify-center my-4">
              <img src="${product.imageUrl}" 
                   alt="${product.title}" 
                   class="rounded-lg shadow-md w-24 h-24 object-contain"
                   loading="lazy" />
            </div>` : '';

          const priceDisplay = product.price ? 
            `<p class="text-left text-sm text-muted-foreground mb-2">💰 Current price: ${product.currency} ${product.price}</p>` : '';
          
          const reviewInfo = product.rating ? 
            `<p class="text-left text-sm text-muted-foreground mb-4">
              ⭐ Rating: ${product.rating.toFixed(1)} out of 5 stars 
              ${product.totalRatings ? `(${product.totalRatings.toLocaleString()} reviews)` : ''}
            </p>` : '';

          const descriptionHtml = customDescription ? 
            `<p class="text-left text-sm md:text-base mb-4">${customDescription}</p>` : '';

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
        }
      } catch (error) {
        console.error('Error processing product:', productName, error);
      }
    }

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