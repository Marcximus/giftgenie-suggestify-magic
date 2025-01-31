import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

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
          success: false,
          min_price: 20,
          max_price: 100,
          error: 'Invalid prompt provided'
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
      console.error('DEEPSEEK_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          success: false,
          min_price: 20,
          max_price: 100,
          error: 'API configuration error'
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

    const analysisPrompt = `Given this gift request: "${prompt}", extract the minimum and maximum price range in USD.
If no specific price is mentioned, use context clues to determine an appropriate range.
Return ONLY a JSON object with 'min_price' and 'max_price' as numbers (no currency symbols or commas).
Example: {"min_price": 20, "max_price": 50}`;

    console.log('Making DeepSeek API request for price analysis');
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
            content: "You are a price range analyzer. You extract price ranges from gift requests and return them in a specific JSON format."
          },
          { role: "user", content: analysisPrompt }
        ],
        max_tokens: 100,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', {
        status: response.status,
        statusText: response.statusText
      });
      return new Response(
        JSON.stringify({
          success: false,
          min_price: 20,
          max_price: 100,
          error: 'Failed to analyze price range'
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
    console.log('DeepSeek response received:', data);

    if (!data.choices?.[0]?.message?.content) {
      return new Response(
        JSON.stringify({
          success: false,
          min_price: 20,
          max_price: 100,
          error: 'Invalid response format from API'
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
      priceRange = JSON.parse(data.choices[0].message.content);
      console.log('Parsed price range:', priceRange);
    } catch (error) {
      console.error('Error parsing price range:', error);
      return new Response(
        JSON.stringify({
          success: false,
          min_price: 20,
          max_price: 100,
          error: 'Failed to parse price range'
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
          success: false,
          min_price: 20,
          max_price: 100,
          error: 'Invalid price range values'
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

    return new Response(
      JSON.stringify({
        success: true,
        min_price: priceRange.min_price,
        max_price: priceRange.max_price
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-price-range function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        min_price: 20,
        max_price: 100,
        error: 'Failed to analyze price range',
        details: error.message
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});