import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const searchAmazonProduct = async (searchTerm: string) => {
  try {
    const { data, error } = await fetch('http://localhost:54321/functions/v1/get-amazon-products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchTerm }),
    }).then(res => res.json());

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching Amazon product:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title } = await req.json()
    console.log('Generating blog post for:', title)

    // Extract price range and topic from title if present
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
            content: `You are a professional gift blog writer specializing in creating engaging, detailed content. Follow these guidelines:

1. Write in a fun, conversational tone with personality
2. Use HTML formatting (h2, h3, p tags)
3. Include relevant emojis in ALL section headings
4. Create detailed sections:
   - Engaging introduction (2-3 paragraphs)
   - Why these gifts are perfect (2-3 paragraphs)
   - Each product recommendation (3-4 paragraphs per item)
   - Tips for choosing the right gift
   - Conclusion with call-to-action
5. For each product recommendation:
   - Explain why it's a great gift
   - Describe key features and benefits
   - Share potential scenarios where it would be perfect
   - Include personal anecdotes or examples
6. Use bullet points and numbered lists where appropriate
7. Format prices as USD
8. Ensure proper HTML formatting
9. STRICTLY follow price limits mentioned in title
10. Make content fun and engaging with:
    - Personal stories
    - Humor and wit
    - Practical examples
    - Relatable scenarios
11. Minimum length: 1500 words
12. Include placeholder tags for product images: [PRODUCT_IMAGE_PLACEHOLDER]`
          },
          {
            role: "user",
            content: `Write a detailed blog post with the title: "${title}". 
            Requirements:
            1. STRICTLY follow the criteria in the title (price range, number of items)
            2. Each product recommendation should be specific and detailed
            3. Include [PRODUCT_IMAGE_PLACEHOLDER] tags for product images
            4. Format with proper HTML tags
            5. Include emojis in ALL section headings
            6. Keep all recommendations under $${maxPrice}
            7. Include exactly ${numProducts} product recommendations
            8. Focus specifically on ${subject}
            9. Make it fun and engaging
            10. Minimum 1500 words`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate blog post')
    }

    const data = await response.json()
    let content = data.choices[0].message.content

    // Get Amazon Associate ID
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID')
    if (!associateId) {
      throw new Error('Amazon Associate ID not configured')
    }

    // Extract product suggestions from the content
    const productMatches = content.match(/(?<=<h[23]>)[^<]+(?=<\/h[23]>)/g) || [];
    
    // Process each product suggestion
    for (const productName of productMatches) {
      const product = await searchAmazonProduct(productName);
      if (product && product.asin) {
        const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
        const imageHtml = product.imageUrl ? 
          `<div class="my-4">
            <img src="${product.imageUrl}" alt="${product.title}" class="rounded-lg shadow-md mx-auto" />
           </div>` : '';
        
        // Replace the product mention with a linked version and image
        content = content.replace(
          '[PRODUCT_IMAGE_PLACEHOLDER]',
          imageHtml
        );
        
        // Add affiliate link to product title
        content = content.replace(
          new RegExp(`<h[23]>${productName}</h[23]>`),
          `<h3>${product.title} 
           <a href="${affiliateLink}" target="_blank" rel="noopener noreferrer" 
              class="text-primary hover:text-primary/80">
             View on Amazon
           </a>
          </h3>`
        );
      }
    }

    // If any [PRODUCT_IMAGE_PLACEHOLDER] tags remain, try to get images from Google
    if (content.includes('[PRODUCT_IMAGE_PLACEHOLDER]')) {
      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY');
      const SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

      if (GOOGLE_API_KEY && SEARCH_ENGINE_ID) {
        const remainingPlaceholders = content.match(/\[PRODUCT_IMAGE_PLACEHOLDER\]/g) || [];
        for (const placeholder of remainingPlaceholders) {
          try {
            const searchTerm = `${subject} gift product`;
            const response = await fetch(
              `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${searchTerm}&num=1`
            );
            
            if (response.ok) {
              const data = await response.json();
              const imageUrl = data.items?.[0]?.link;
              
              if (imageUrl) {
                const imageHtml = `<div class="my-4">
                  <img src="${imageUrl}" alt="Gift suggestion" class="rounded-lg shadow-md mx-auto" />
                </div>`;
                content = content.replace('[PRODUCT_IMAGE_PLACEHOLDER]', imageHtml);
              }
            }
          } catch (error) {
            console.error('Error fetching Google image:', error);
            content = content.replace('[PRODUCT_IMAGE_PLACEHOLDER]', '');
          }
        }
      }
    }

    // Remove any remaining placeholders
    content = content.replace(/\[PRODUCT_IMAGE_PLACEHOLDER\]/g, '');

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-blog-post function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})