import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateAndCleanSuggestions } from '../_shared/suggestion-validator.ts';
import { processSuggestionsInBatches } from '../_shared/batch-processor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const startTime = performance.now();
  console.log('Starting gift suggestion generation...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, analyze the price range
    console.log('Analyzing price range...');
    const { data: priceRangeData, error: priceRangeError } = await supabase.functions.invoke('analyze-price-range', {
      body: { prompt }
    });

    if (priceRangeError) {
      console.error('Error analyzing price range:', priceRangeError);
      throw new Error(`Price range analysis failed: ${priceRangeError.message || 'Unknown error'}`);
    }

    console.log('Price range analysis response:', priceRangeData);

    if (!priceRangeData || typeof priceRangeData.min_price !== 'number' || typeof priceRangeData.max_price !== 'number') {
      console.error('Invalid price range response:', priceRangeData);
      throw new Error('Invalid price range format received');
    }

    const priceRange = {
      min_price: parseFloat(priceRangeData.min_price),
      max_price: parseFloat(priceRangeData.max_price)
    };
    console.log('Analyzed price range:', priceRange);

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const enhancedPrompt = `You are a gifting expert. Based on the request "${prompt}", suggest 8 specific gift ideas.

CRITICAL REQUIREMENTS:
1. Price Range: STRICTLY stay between $${priceRange.min_price.toFixed(2)} and $${priceRange.max_price.toFixed(2)}
2. Format: Return ONLY a JSON array of strings
3. Each suggestion MUST include the EXACT price in parentheses at the end
4. Example format: "Leather Wallet with RFID Protection - Genuine Full Grain Leather ($45.99)"

IMPORTANT PRICE RULES:
- Every suggestion MUST end with a specific price in parentheses
- All prices MUST be between $${priceRange.min_price.toFixed(2)} and $${priceRange.max_price.toFixed(2)}
- Use realistic, market-accurate prices
- Include the dollar sign and decimals in prices

Consider:
- Age, gender, and occasion mentioned
- The recipient's interests and preferences
- Each suggestion should be from a DIFFERENT category
- Include specific product details and features

Return EXACTLY 8 suggestions, each ending with a specific price in parentheses.`;

    console.log('Making DeepSeek API request with enhanced prompt...');
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
            content: "You are a gift suggestion expert. Price accuracy is CRITICAL. Always include EXACT prices in parentheses at the end of each suggestion."
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

    // Extract and validate suggestions
    let suggestions = validateAndCleanSuggestions(data.choices[0].message.content);
    console.log('Initial suggestions:', suggestions);
    
    if (!suggestions || suggestions.length !== 8) {
      console.error('Invalid number of suggestions:', suggestions?.length);
      throw new Error('Did not receive exactly 8 suggestions');
    }

    // Validate prices in suggestions with more detailed logging
    suggestions = suggestions.filter(suggestion => {
      console.log('Validating suggestion:', suggestion);
      const priceMatch = suggestion.match(/\(\$(\d+\.?\d*)\)$/);
      
      if (!priceMatch) {
        console.log('❌ No price found in suggestion:', suggestion);
        return false;
      }
      
      const price = parseFloat(priceMatch[1]);
      console.log('Extracted price:', price, 'Range:', priceRange.min_price, '-', priceRange.max_price);
      
      if (isNaN(price)) {
        console.log('❌ Invalid price format:', priceMatch[1]);
        return false;
      }
      
      if (price < priceRange.min_price) {
        console.log('❌ Price below minimum:', price, '<', priceRange.min_price);
        return false;
      }
      
      if (price > priceRange.max_price) {
        console.log('❌ Price above maximum:', price, '>', priceRange.max_price);
        return false;
      }
      
      console.log('✅ Valid suggestion with price:', price);
      return true;
    });

    if (suggestions.length < 8) {
      console.log('Not enough valid suggestions after price filtering:', suggestions.length);
      throw new Error(`Not enough valid suggestions within price range $${priceRange.min_price.toFixed(2)}-$${priceRange.max_price.toFixed(2)}`);
    }

    // Process suggestions with the analyzed price range
    console.log('Processing suggestions with price range:', priceRange);
    const processedProducts = await processSuggestionsInBatches(suggestions);
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