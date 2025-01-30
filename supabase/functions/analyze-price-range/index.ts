import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Analyzing price range for prompt:', prompt);

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

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
            content: `You are a price range analyzer. Your task is to analyze user input and extract or infer an appropriate price range in USD.

Rules for price extraction:
1. If a specific budget or price range is mentioned (e.g., "$50-100", "under $50", "$100 budget"), use those exact values
2. If a price range is implied by the type of gift or recipient, infer a reasonable range
3. Always return prices as exact decimal numbers with 2 decimal places (e.g., 49.99)
4. The minimum price should never be less than 5.00
5. The maximum price should be reasonable for the type of gift
6. If no price is mentioned, use context clues from the gift type and recipient

Return ONLY a JSON object in this exact format:
{
  "min_price": number,
  "max_price": number
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', await response.text());
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const content = data.choices[0].message.content.trim();
    console.log('Extracted content:', content);

    try {
      const priceRange = JSON.parse(content);
      
      // Validate the price range format
      if (typeof priceRange.min_price !== 'number' || typeof priceRange.max_price !== 'number') {
        throw new Error('Invalid price range format');
      }

      // Ensure minimum price is at least $5
      priceRange.min_price = Math.max(5.00, Number(priceRange.min_price.toFixed(2)));
      priceRange.max_price = Number(priceRange.max_price.toFixed(2));

      // Ensure max price is greater than min price
      if (priceRange.max_price <= priceRange.min_price) {
        priceRange.max_price = priceRange.min_price * 1.5; // Add 50% to min price as fallback
      }

      console.log('Final price range:', priceRange);

      return new Response(
        JSON.stringify(priceRange),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error parsing price range:', error);
      throw new Error('Failed to parse price range from DeepSeek response');
    }

  } catch (error) {
    console.error('Error in analyze-price-range function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});