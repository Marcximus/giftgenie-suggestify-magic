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
      throw new Error('Invalid or missing prompt');
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
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
        throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('DeepSeek response:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from DeepSeek API');
      }

      let priceRange;
      try {
        const content = data.choices[0].message.content.trim();
        console.log('Parsing content:', content);
        priceRange = JSON.parse(content);
      } catch (error) {
        console.error('Failed to parse price range JSON:', error);
        throw new Error('Invalid JSON in DeepSeek response');
      }

      // Validate price range
      if (typeof priceRange.min_price !== 'number' || typeof priceRange.max_price !== 'number') {
        console.error('Invalid price range format:', priceRange);
        throw new Error('Price range must contain numeric values');
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
        JSON.stringify(priceRange),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('DeepSeek API request timed out after 15 seconds');
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in analyze-price-range function:', error);
    
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