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

    // Extract the main subject (e.g., "boyfriend gifts" from "Top 5 Boyfriend Gifts Under $50")
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
            content: `You are a professional gift blog writer. Create engaging, well-structured blog posts about gifts and shopping recommendations. Follow these guidelines:
            1. Use HTML formatting for structure (h2, h3, p tags, etc.)
            2. Include emojis where appropriate 🎁
            3. Break content into clear sections
            4. Include specific product recommendations that match the title's criteria
            5. Use bullet points and numbered lists where appropriate
            6. Keep the tone friendly and informative
            7. Include a conclusion section
            8. Format prices as USD
            9. Make sure all HTML is properly formatted and nested
            10. Add relevant emojis to section headings
            11. STRICTLY adhere to any price limits or criteria mentioned in the title
            12. Include a call-to-action at the end`
          },
          {
            role: "user",
            content: `Write a detailed blog post with the title: "${title}". 
            Important requirements:
            1. The post must STRICTLY follow the criteria in the title (price range, number of items, etc.)
            2. Each product recommendation should be specific and detailed
            3. Include placeholders for product images and affiliate links that I will replace
            4. Format the content with proper HTML tags
            5. Include emojis in section headings
            6. Make sure all recommendations stay under $${maxPrice}
            7. Include exactly ${numProducts} product recommendations
            8. Focus specifically on ${subject}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
          new RegExp(`<h[23]>${productName}</h[23]>`),
          `<h3>${product.title} 
           <a href="${affiliateLink}" target="_blank" rel="noopener noreferrer" 
              class="text-primary hover:text-primary/80">
             View on Amazon
           </a>
          </h3>
          ${imageHtml}`
        );
      }
    }

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