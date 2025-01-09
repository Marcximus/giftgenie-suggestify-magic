import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

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
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  return recentRequests.length >= RATE_LIMIT.MAX_REQUESTS;
}

async function searchAmazonProduct(keyword: string) {
  if (isRateLimited()) {
    throw new Error('Rate limit exceeded. Please try again in a moment.');
  }

  console.log('Searching Amazon for:', keyword);
  const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(keyword)}&country=US`;
  
  try {
    requestLog.push({ timestamp: Date.now() });
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey || '',
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('Amazon API error:', response.status);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error('Failed to fetch Amazon data');
    }

    const data = await response.json();
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
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!rapidApiKey) {
      throw new Error('RapidAPI key not configured');
    }

    // Get gift suggestions from GPT
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
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
    const suggestions = JSON.parse(data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim());
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    // Search Amazon products for each suggestion
    const products = await Promise.all(
      suggestions.map(suggestion => searchAmazonProduct(suggestion))
    );

    // Filter out null results and format response
    const validProducts = products.filter(product => product !== null);

    return new Response(
      JSON.stringify({ suggestions: validProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
    const status = error.message.includes('Rate limit') ? 429 : 
                  error.message.includes('API key') ? 403 : 500;
                  
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate gift suggestions'
      }),
      {
        status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          ...(status === 429 && { 'Retry-After': '30' })
        }
      }
    );
  }
});