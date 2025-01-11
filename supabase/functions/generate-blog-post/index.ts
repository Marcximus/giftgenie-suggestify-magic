import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const searchAmazonProduct = async (searchTerm: string) => {
  try {
    console.log('Searching Amazon for:', searchTerm);
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
12. Include [PRODUCT_PLACEHOLDER] tag BEFORE each product heading
13. Make product titles VERY specific with brand names and models`
          },
          {
            role: "user",
            content: `Write a detailed blog post with the title: "${title}". 
            Requirements:
            1. STRICTLY follow the criteria in the title (price range, number of items)
            2. Each product recommendation should be specific and detailed
            3. Include [PRODUCT_PLACEHOLDER] tag BEFORE each product heading
            4. Format with proper HTML tags
            5. Include emojis in ALL section headings
            6. Keep all recommendations under $${maxPrice}
            7. Include exactly ${numProducts} product recommendations
            8. Focus specifically on ${subject}
            9. Make it fun and engaging
            10. Minimum 1500 words
            11. Include specific brand names and model numbers in product titles`
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
      console.log('Processing product:', productName);
      
      // Get Amazon product details
      const product = await searchAmazonProduct(productName);
      
      if (product && product.asin) {
        // Create affiliate link
        const affiliateLink = `https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=${associateId}`;
        
        // Add product image and affiliate link
        content = content.replace(
          '[PRODUCT_PLACEHOLDER]',
          `<div class="flex justify-center my-4">
            <img src="${product.imageUrl}" 
                 alt="${product.title}" 
                 class="rounded-lg shadow-md w-36 h-36 object-contain" 
                 loading="lazy" />
           </div>`
        );
        
        // Replace product title with actual Amazon product title and add affiliate link
        content = content.replace(
          new RegExp(`<h[23]>${productName}</h[23]>`),
          `<h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
             ${product.title}
             <div class="mt-2">
               <a href="${affiliateLink}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
                 View on Amazon
               </a>
             </div>
           </h3>`
        );

        // Add price information if available
        if (product.price) {
          content = content.replace(
            new RegExp(`(${product.title}.*?</h3>)`),
            `$1\n<p class="text-left text-sm text-muted-foreground mb-4">Current price: $${product.price}</p>`
          );
        }
      } else {
        // Remove placeholder if no product found
        content = content.replace('[PRODUCT_PLACEHOLDER]', '');
      }
    }

    // Remove any remaining placeholders
    content = content.replace(/\[PRODUCT_PLACEHOLDER\]/g, '');

    // Add responsive text classes
    content = content.replace(/<p>/g, '<p class="text-left text-sm md:text-base mb-4">');
    content = content.replace(/<h2>/g, '<h2 class="text-left text-xl md:text-2xl font-bold mt-8 mb-4">');
    content = content.replace(/<h3>/g, '<h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">');
    content = content.replace(/<ul>/g, '<ul class="text-left list-disc pl-6 space-y-2 text-sm md:text-base">');
    content = content.replace(/<ol>/g, '<ol class="text-left list-decimal pl-6 space-y-2 text-sm md:text-base">');

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