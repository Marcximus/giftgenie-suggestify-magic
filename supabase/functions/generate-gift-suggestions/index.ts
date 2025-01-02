import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for storing responses
const responseCache = new Map();

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    // Generate cache key from normalized prompt
    const cacheKey = prompt.toLowerCase().trim();

    // Check cache first
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_EXPIRATION) {
      console.log('Returning cached response');
      return new Response(JSON.stringify(cachedResponse.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const priceRangeMatch = prompt.match(/Budget:\s*\$?(\d+-\d+)/i);
    const originalPriceRange = priceRangeMatch ? priceRangeMatch[1] : null;
    console.log('Extracted price range:', originalPriceRange);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion assistant specializing in trending, popular products from well-known brands. 
            Generate 8 specific gift suggestions based on the description provided. 
            
            Guidelines for suggestions:
            1. Focus on actual products from real, popular brands (e.g., "Apple AirPods Pro (2nd Generation)" instead of just "wireless earbuds")
            2. Include current trending products and bestsellers
            3. Mention specific models, versions, or editions when applicable
            4. Include product features that make it appealing (e.g., "with active noise cancellation and transparency mode")
            5. Reference current year models when possible
            
            STRICT BUDGET RULE: When a price range is mentioned (e.g., $20-40), ensure ALL suggestions stay within 20% of the range bounds.
            
            For each suggestion, provide:
            - title (specific product name with brand)
            - description (detailed features and benefits)
            - priceRange (actual price range, format as 'X-Y')
            - reason (why this specific product is trending/popular)
            
            Return ONLY a raw JSON array. No markdown, no code blocks, just the array. Response must be valid JSON.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    let suggestions;
    try {
      const content = data.choices[0].message.content.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();
      
      console.log('Cleaned content:', content);
      suggestions = JSON.parse(content);

      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      suggestions = suggestions.filter((suggestion, index) => {
        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Suggestion ${index} missing fields:`, missingFields);
          return false;
        }

        if (originalPriceRange) {
          const [minStr, maxStr] = originalPriceRange.split('-').map(n => parseInt(n));
          const min = minStr * 0.8;
          const max = maxStr * 1.2;
          
          const suggestedPrice = suggestion.priceRange.replace(/[^0-9-]/g, '');
          const [suggestedMin, suggestedMax] = suggestedPrice.split('-').map(n => parseInt(n));
          
          if (suggestedMin < min || suggestedMax > max) {
            console.warn(`Suggestion ${index} outside price range:`, suggestion.priceRange);
            return false;
          }
        }

        return true;
      });

      if (suggestions.length < 4) {
        throw new Error('Not enough valid suggestions generated');
      }

      // Cache the successful response
      responseCache.set(cacheKey, {
        data: { suggestions },
        timestamp: Date.now()
      });

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI response',
          details: parseError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ suggestions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'An error occurred while processing your request.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});