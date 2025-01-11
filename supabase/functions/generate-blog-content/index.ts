import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { searchAmazonProduct } from "../_shared/amazon-product-handler.ts";

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
    
    // Generate the initial blog structure with GPT-4
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
            content: `You are a creative gift blog writer who specializes in creating engaging, humorous content with emojis. 
            Generate 10 specific gift ideas for ${occasion}. For each gift:
            1. Include a specific product name with brand
            2. Add a fun emoji
            3. Keep descriptions around 50 words
            4. Make it sound exciting and personal
            
            Format: Return a JSON array of objects, each with:
            - title (string): specific product name
            - description (string): fun description with emojis
            - searchTerm (string): simplified search term for Amazon`
          },
          {
            role: "user",
            content: `Create a top 10 gift guide for: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate initial content');
    }

    const data = await response.json();
    const giftIdeas = JSON.parse(data.choices[0].message.content);

    // Process each gift idea with Amazon product data
    const processedGifts = [];
    for (const gift of giftIdeas) {
      try {
        const product = await searchAmazonProduct(gift.searchTerm);
        if (product) {
          processedGifts.push({
            ...gift,
            amazonData: {
              asin: product.asin,
              price: product.price,
              currency: product.currency,
              imageUrl: product.imageUrl,
              rating: product.rating,
              totalRatings: product.totalRatings,
              affiliateUrl: `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${Deno.env.get('AMAZON_ASSOCIATE_ID')}`
            }
          });
        }
      } catch (error) {
        console.error('Error processing product:', error);
      }
    }

    // Generate the final HTML content
    const introResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Create a fun, engaging introduction for a gift guide blog post. Include:
            1. A catchy opening
            2. Why these gifts are perfect
            3. Tips for choosing the right gift
            Keep it concise and use some emojis for fun!`
          },
          {
            role: "user",
            content: `Write an introduction for: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const introData = await introResponse.json();
    const introduction = introData.choices[0].message.content;

    // Format the final blog post HTML
    const blogContent = `
      <article class="prose prose-sm md:prose-base lg:prose-lg max-w-none">
        <h1 class="text-left text-2xl md:text-3xl lg:text-4xl font-bold mb-8">${title} 🎁</h1>
        
        ${introduction}
        
        <div class="space-y-8 mt-8">
          ${processedGifts.map((gift, index) => `
            [PRODUCT_PLACEHOLDER]
            <h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
              #${index + 1}: ${gift.title}
              <div class="mt-2">
                <a href="${gift.amazonData.affiliateUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
                  View on Amazon
                </a>
              </div>
            </h3>
            <p class="text-left text-sm text-muted-foreground mb-4">
              Current price: ${gift.amazonData.currency} ${gift.amazonData.price}
              ${gift.amazonData.rating ? ` · Rating: ${gift.amazonData.rating}/5 (${gift.amazonData.totalRatings} reviews)` : ''}
            </p>
            <p class="text-left text-sm md:text-base leading-relaxed mb-4">
              ${gift.description}
            </p>
          `).join('')}
        </div>
        
        <div class="mt-8 text-left">
          <h2 class="text-xl md:text-2xl font-bold mb-4">Ready to Make Someone's Day? 🎉</h2>
          <p class="text-sm md:text-base text-muted-foreground">
            We hope this guide helps you find the perfect gift! Remember, it's the thought that counts, 
            but a well-chosen present can make any occasion extra special. Happy gifting! 🎁
          </p>
        </div>
      </article>
    `;

    return new Response(
      JSON.stringify({ 
        content: blogContent,
        affiliateLinks: processedGifts.map(gift => ({
          productTitle: gift.title,
          affiliateLink: gift.amazonData.affiliateUrl,
          imageUrl: gift.amazonData.imageUrl
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating blog content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});