import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting
const requestLog: { timestamp: number }[] = [];
const RATE_LIMIT = {
  WINDOW_MS: 60000, // 1 minute
  MAX_REQUESTS: 5,
};

function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  
  // Clean up old requests
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  return recentRequests.length >= RATE_LIMIT.MAX_REQUESTS;
}

async function searchAmazonProduct(keyword: string) {
  if (isRateLimited()) {
    throw new Error('RATE_LIMITED');
  }

  console.log('Searching Amazon for:', keyword);
  const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(keyword)}&country=US`;
  
  try {
    requestLog.push({ timestamp: Date.now() });
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY') || '',
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('Amazon API error:', response.status);
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (response.status === 403) {
        throw new Error('API_KEY_INVALID');
      }
      throw new Error(`Amazon API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Amazon API response:', JSON.stringify(data, null, 2));

    if (data.status === 'ERROR') {
      throw new Error(data.error.message);
    }

    const product = data.data?.products?.[0];
    if (!product) {
      console.log('No product found for keyword:', keyword);
      return null;
    }

    return {
      title: product.title,
      description: product.description || product.title,
      priceRange: `USD ${product.price?.current_price || '0'}`,
      reason: `This ${product.title} would make a great gift because it's highly rated and matches your requirements.`,
      amazon_asin: product.asin,
      amazon_url: product.asin ? `https://www.amazon.com/dp/${product.asin}` : undefined,
      amazon_price: product.price?.current_price,
      amazon_image_url: product.image,
      amazon_rating: product.rating,
      amazon_total_ratings: product.ratings_total
    };
  } catch (error) {
    console.error('Error fetching Amazon product:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    // Get gift suggestions from GPT
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a gift suggestion expert. Generate SPECIFIC gift suggestions based on the description provided.
            Return EXACTLY 8 specific product keywords that can be found on Amazon.com.
            Format the response as a JSON array of strings.
            Example: ["Sony WH-1000XM4 Headphones", "Kindle Paperwhite", "Nintendo Switch OLED"]`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    // Parse the suggestions and clean up the JSON
    const suggestions = JSON.parse(
      data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim()
    );
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    // Search Amazon products for each suggestion
    const products = [];
    for (const suggestion of suggestions) {
      try {
        const product = await searchAmazonProduct(suggestion);
        if (product) {
          products.push(product);
        }
        // Add delay between requests to help prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.message === 'RATE_LIMITED') {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded. Please try again in a moment.',
              retryAfter: '30'
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': '30'
              }
            }
          );
        }
        if (error.message === 'API_KEY_INVALID') {
          return new Response(
            JSON.stringify({
              error: 'API authentication failed. Please check API key configuration.',
              details: 'Invalid or expired API key'
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        console.error('Error processing suggestion:', suggestion, error);
        continue; // Skip failed products but continue with others
      }
    }

    return new Response(
      JSON.stringify({ suggestions: products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate gift suggestions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});