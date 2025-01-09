import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchAmazonProduct, AmazonApiError } from '../_shared/amazon-api.ts';
import { GiftSuggestion } from '../_shared/types.ts';

// Track API requests with a simple in-memory store
const requestLog: { timestamp: number }[] = [];
const RATE_LIMIT = {
  WINDOW_MS: 60000, // 1 minute
  MAX_REQUESTS: 10, // Maximum requests per minute
  RETRY_AFTER: 30 // Seconds to wait before retrying
};

function isRateLimited(): boolean {
  const now = Date.now();
  // Clean up old requests
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  return recentRequests.length >= RATE_LIMIT.MAX_REQUESTS;
}

function logRequest() {
  requestLog.push({ timestamp: Date.now() });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check rate limit before processing
    if (isRateLimited()) {
      console.log('Rate limit exceeded, returning 429');
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again in a moment.',
          retryAfter: RATE_LIMIT.RETRY_AFTER
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': RATE_LIMIT.RETRY_AFTER.toString()
          }
        }
      );
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    // Log this request
    logRequest();

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
      console.error('OpenAI API error:', response.status);
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

    // Process suggestions sequentially with delay between requests
    const products: GiftSuggestion[] = [];
    for (const suggestion of suggestions) {
      try {
        const product = await searchAmazonProduct(suggestion);
        if (product) {
          products.push({
            title: product.title || suggestion,
            description: product.description || suggestion,
            priceRange: `${product.price?.currency || 'USD'} ${product.price?.current_price || '0'}`,
            reason: `This ${product.title} would make a great gift because it matches your requirements.`,
            amazon_asin: product.asin,
            amazon_url: product.asin ? `https://www.amazon.com/dp/${product.asin}` : undefined,
            amazon_price: product.price?.current_price,
            amazon_image_url: product.main_image,
            amazon_rating: product.rating,
            amazon_total_ratings: product.ratings_total
          });
        }
        // Add delay between requests to help prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error processing suggestion:', suggestion, error);
        if (error instanceof AmazonApiError && error.status === 429) {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded. Please try again in a moment.',
              retryAfter: error.retryAfter
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': error.retryAfter || '30'
              }
            }
          );
        }
        continue; // Skip failed products but continue with others
      }
    }

    return new Response(
      JSON.stringify({ suggestions: products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
    const status = error instanceof AmazonApiError ? error.status || 500 : 500;
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate gift suggestions'
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});