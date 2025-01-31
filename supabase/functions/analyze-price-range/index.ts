import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Price range analysis started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Analyzing prompt for price range:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt:', prompt);
      return new Response(
        JSON.stringify({
          error: 'Invalid prompt provided',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
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
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const analysisPrompt = `Given this gift request: "${prompt}", extract the minimum and maximum price range in USD.
If no specific price is mentioned, use context clues to determine an appropriate range.
Return ONLY a JSON object with 'min_price' and 'max_price' as numbers (no currency symbols or commas).
Example: {"min_price": 20, "max_price": 50}

IMPORTANT:
- Both values must be positive numbers
- min_price must be less than max_price
- If no price is mentioned, infer a reasonable range based on the type of gift
- Round numbers to nearest whole dollar
- Default to a reasonable range if unclear (e.g., $20-$50 for general gifts)`;

    console.log('Making DeepSeek API request with prompt:', analysisPrompt);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
              content: "You are a price range analyzer. Extract or infer appropriate price ranges for gift requests and return them in a specific JSON format."
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
        const errorText = await response.text();
        console.error('DeepSeek API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return new Response(
          JSON.stringify({
            error: 'Failed to analyze price range',
            details: `DeepSeek API error: ${response.status}`,
            timestamp: new Date().toISOString()
          }),
          { 
            status: 502,
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
        console.error('Invalid response format:', data);
        return new Response(
          JSON.stringify({
            error: 'Invalid response format from DeepSeek API',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 502,
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
        console.log('Attempting to parse content:', content);
        priceRange = JSON.parse(content);
        console.log('Successfully parsed price range:', priceRange);
      } catch (error) {
        console.error('Error parsing price range:', error);
        console.error('Raw content:', data.choices[0].message.content);
        return new Response(
          JSON.stringify({
            error: 'Failed to parse price range from API response',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 502,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Validate the price range
      if (
        typeof priceRange.min_price !== 'number' ||
        typeof priceRange.max_price !== 'number' ||
        priceRange.min_price < 0 ||
        priceRange.max_price <= priceRange.min_price
      ) {
        console.error('Invalid price range values:', priceRange);
        return new Response(
          JSON.stringify({
            error: 'Invalid price range values received',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
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
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        }
      );

    } catch (error) {
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            error: 'Request timeout',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 504,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    console.error('Error in analyze-price-range function:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze price range',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});