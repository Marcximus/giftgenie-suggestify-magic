import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchAmazonProduct, AmazonApiError } from '../_shared/amazon-api.ts';
import { GiftSuggestion } from '../_shared/types.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

async function generateCustomDescription(title: string, originalDescription: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a gift suggestion expert. Generate an engaging and concise product description that highlights why this would make a great gift. Keep it under 100 words. Do not use quotation marks in your response."
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nGenerate a gift-focused description without quotation marks.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return originalDescription;
    }

    const data = await response.json();
    // Remove any quotation marks from the generated description
    return data.choices?.[0]?.message?.content?.replace(/['"]/g, '') || originalDescription;
  } catch (error) {
    console.error('Error generating custom description:', error);
    return originalDescription;
  }
}

// Track API requests with a simple in-memory store
const requestLog: { timestamp: number }[] = [];
const RATE_LIMIT = {
  WINDOW_MS: 30000, // 30 seconds
  MAX_REQUESTS: 15, // Maximum requests per 30 seconds
  RETRY_AFTER: 15 // Seconds to wait before retrying
};

function isRateLimited(): boolean {
  const now = Date.now();
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

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

    logRequest();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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

    const suggestions = JSON.parse(
      data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim()
    );
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    // Process suggestions with enhanced product details and custom descriptions
    const productPromises = suggestions.map((suggestion, index) => {
      return new Promise<GiftSuggestion>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1000));
        
        try {
          const product = await searchAmazonProduct(suggestion);
          if (product) {
            // Generate custom description using ChatGPT and remove any quotation marks
            const customDescription = await generateCustomDescription(
              product.title || suggestion,
              product.description || suggestion
            );

            resolve({
              title: product.title || suggestion,
              description: customDescription.replace(/['"]/g, ''), // Extra safety to remove any remaining quotes
              priceRange: `${product.price?.currency || 'USD'} ${product.price?.current_price || '0'}`,
              reason: `This ${product.title} would make a great gift because it matches your requirements.`.replace(/['"]/g, ''),
              amazon_asin: product.asin,
              amazon_url: product.asin ? `https://www.amazon.com/dp/${product.asin}` : undefined,
              amazon_price: product.price?.current_price,
              amazon_image_url: product.main_image,
              amazon_rating: product.rating,
              amazon_total_ratings: product.ratings_total
            });
          } else {
            resolve({
              title: suggestion,
              description: suggestion,
              priceRange: 'Price not available',
              reason: 'This item matches your requirements.',
              search_query: suggestion
            });
          }
        } catch (error) {
          console.error('Error processing suggestion:', suggestion, error);
          resolve({
            title: suggestion,
            description: suggestion,
            priceRange: 'Price not available',
            reason: 'This item matches your requirements.',
            search_query: suggestion
          });
        }
      });
    });

    const products = await Promise.all(productPromises);

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