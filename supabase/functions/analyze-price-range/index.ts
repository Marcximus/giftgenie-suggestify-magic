import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Starting price range analysis...');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Analyzing prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: 'Missing or invalid prompt',
          min_price: 20,
          max_price: 100
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration error',
          details: 'API key not configured',
          min_price: 20,
          max_price: 100
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const enhancedPrompt = `Analyze this gift request: "${prompt}"

Return ONLY a JSON object with these exact keys:
{
  "min_price": number (minimum price in USD, must be >= 0),
  "max_price": number (maximum price in USD, must be > min_price and <= 1000)
}

RULES:
- If no price is mentioned, use min_price: 20 and max_price: 100
- Never exceed max_price of 1000 unless explicitly requested
- Always return numbers, not strings
- Prices must be realistic for the type of gift
- Round to nearest dollar
- min_price must be >= 0
- max_price must be > min_price`;

    console.log('Making DeepSeek API request...');
    
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
              content: "You are a price range analyzer. Return only valid JSON with min_price and max_price as numbers."
            },
            { role: "user", content: enhancedPrompt }
          ],
          max_tokens: 150,
          temperature: 0.3
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: 'API error',
            details: `Failed to analyze price range`,
            min_price: 20,
            max_price: 100
          }),
          { 
            status: 200,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const data = await response.json();
      console.log('DeepSeek response:', data);

      if (!data.choices?.[0]?.message?.content) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid response',
            details: 'Could not parse price range',
            min_price: 20,
            max_price: 100
          }),
          { 
            status: 200,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      let priceRange;
      try {
        const content = data.choices[0].message.content.trim();
        console.log('Parsing content:', content);
        priceRange = JSON.parse(content);
      } catch (error) {
        console.error('Failed to parse price range JSON:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Parse error',
            details: 'Could not parse price range',
            min_price: 20,
            max_price: 100
          }),
          { 
            status: 200,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Validate price range
      if (typeof priceRange.min_price !== 'number' || typeof priceRange.max_price !== 'number') {
        console.error('Invalid price range format:', priceRange);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation error',
            details: 'Invalid price range format',
            min_price: 20,
            max_price: 100
          }),
          { 
            status: 200,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (priceRange.min_price < 0) {
        console.log('Adjusting negative min_price to 0');
        priceRange.min_price = 0;
      }

      if (priceRange.max_price <= priceRange.min_price) {
        console.log('Adjusting max_price to be greater than min_price');
        priceRange.max_price = priceRange.min_price + 50;
      }

      if (priceRange.max_price > 1000 && !prompt.toLowerCase().includes('expensive') && !prompt.toLowerCase().includes('luxury')) {
        console.log('Capping max_price at 1000');
        priceRange.max_price = 1000;
      }

      console.log('Final price range:', priceRange);

      return new Response(
        JSON.stringify({
          success: true,
          ...priceRange
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );

    } catch (error) {
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Timeout',
            details: 'Request timed out',
            min_price: 20,
            max_price: 100
          }),
          { 
            status: 200,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in analyze-price-range function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        details: 'Failed to analyze price range',
        min_price: 20,
        max_price: 100
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});