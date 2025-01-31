import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceRange {
  min_price: number;
  max_price: number;
}

serve(async (req) => {
  console.log('Price range analysis started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Analyzing prompt for price range:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid prompt provided',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      console.error('DEEPSEEK_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'Service configuration error',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const analysisPrompt = `
Given this gift request: "${prompt}", extract the exact minimum and maximum price range in USD.
If a specific price range is mentioned, use those exact values.
If no specific price is mentioned, infer a reasonable range based on the type of gift.

CRITICAL REQUIREMENTS:
1. Return ONLY a JSON object with 'min_price' and 'max_price' as numbers
2. Both values must be positive whole numbers
3. min_price must be less than max_price
4. Round to nearest whole dollar
5. If unclear, use conservative defaults ($20-$50)
6. Never exceed $1000 for max_price unless explicitly stated
7. Format: {"min_price": 20, "max_price": 50}

Example outputs:
- "around $30" → {"min_price": 25, "max_price": 35}
- "under $50" → {"min_price": 20, "max_price": 50}
- "$100-$200" → {"min_price": 100, "max_price": 200}`;

    console.log('Making DeepSeek API request');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a price range analyzer. Extract or infer appropriate price ranges for gift requests."
            },
            { role: "user", content: analysisPrompt }
          ],
          max_tokens: 100,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error('DeepSeek API error:', {
          status: response.status,
          statusText: response.statusText
        });
        return new Response(
          JSON.stringify({
            error: 'DeepSeek API error',
            details: `Status: ${response.status}`,
            timestamp: new Date().toISOString()
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      console.log('DeepSeek response:', data);

      if (!data.choices?.[0]?.message?.content) {
        return new Response(
          JSON.stringify({
            error: 'Invalid response format',
            details: 'Missing content in API response',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      let priceRange: PriceRange;
      try {
        const content = data.choices[0].message.content.trim();
        console.log('Parsing content:', content);
        priceRange = JSON.parse(content);
      } catch (error) {
        console.error('Error parsing price range:', error);
        return new Response(
          JSON.stringify({
            error: 'Parse error',
            details: 'Failed to parse price range from response',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Validate the price range
      if (
        typeof priceRange.min_price !== 'number' ||
        typeof priceRange.max_price !== 'number' ||
        priceRange.min_price < 0 ||
        priceRange.max_price <= priceRange.min_price ||
        priceRange.max_price > 1000
      ) {
        console.error('Invalid price range values:', priceRange);
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            details: 'Invalid price range values',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Round to whole numbers
      priceRange.min_price = Math.round(priceRange.min_price);
      priceRange.max_price = Math.round(priceRange.max_price);

      console.log('Returning validated price range:', priceRange);

      return new Response(
        JSON.stringify(priceRange),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } catch (error) {
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            error: 'Timeout',
            details: 'Request timed out after 15 seconds',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in analyze-price-range function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});