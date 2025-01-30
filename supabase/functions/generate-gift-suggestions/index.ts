import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { validateAndCleanSuggestions } from '../_shared/suggestion-validator.ts';
import { processSuggestionsInBatches } from '../_shared/batch-processor.ts';

serve(async (req) => {
  const startTime = performance.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    // First, analyze the price range
    console.log('Analyzing price range...');
    const priceRangeResponse = await (Deno as any).env.supabaseFunctionClient.invoke('analyze-price-range', {
      body: { prompt }
    });

    if (priceRangeResponse.error) {
      console.error('Error analyzing price range:', priceRangeResponse.error);
      throw new Error(`Price range analysis failed: ${priceRangeResponse.error.message || 'Unknown error'}`);
    }

    if (!priceRangeResponse.data || typeof priceRangeResponse.data.min_price !== 'number' || typeof priceRangeResponse.data.max_price !== 'number') {
      console.error('Invalid price range response:', priceRangeResponse);
      throw new Error('Invalid price range format received');
    }

    const priceRange = priceRangeResponse.data;
    console.log('Analyzed price range:', priceRange);

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const enhancedPrompt = `You are a gifting expert. Based on the request "${prompt}", suggest 8 specific gift ideas.

Consider:
- Age, gender, and occasion mentioned
- CRITICAL: Stay within the price range of $${priceRange.min_price.toFixed(2)} to $${priceRange.max_price.toFixed(2)}
- The recipient's interests and preferences
- Avoid suggesting identical items

Return ONLY a JSON array of exactly 8 strings`;

    console.log('Making DeepSeek API request...');
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
            content: "You are a gift suggestion expert. Staying within a given price range is HIGHLY important to you. You like recommending premium gifts."
          },
          { role: "user", content: enhancedPrompt }
        ],
        max_tokens: 1000,
        temperature: 1.3,
        stream: false
      }),
    });

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
    console.log('DeepSeek response received:', {
      status: response.status,
      hasChoices: !!data.choices,
      firstChoice: !!data.choices?.[0]
    });

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid DeepSeek response format:', data);
      throw new Error('Invalid response format from DeepSeek API');
    }

    const suggestions = validateAndCleanSuggestions(data.choices[0].message.content);
    console.log('Validated suggestions:', suggestions);
    
    if (!suggestions || suggestions.length !== 8) {
      console.error('Invalid number of suggestions:', suggestions?.length);
      throw new Error('Did not receive exactly 8 suggestions');
    }

    // Process suggestions with the analyzed price range
    console.log('Processing suggestions with price range:', priceRange);
    const processedProducts = await processSuggestionsInBatches(suggestions, priceRange);
    console.log('Processed products:', processedProducts);
    
    if (!processedProducts.length) {
      throw new Error('No products found for suggestions');
    }

    return new Response(
      JSON.stringify({ 
        suggestions: processedProducts,
        debug: {
          priceRange,
          suggestionsCount: suggestions.length,
          processedCount: processedProducts.length,
          duration: Math.round(performance.now() - startTime)
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate gift suggestions',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  }
});