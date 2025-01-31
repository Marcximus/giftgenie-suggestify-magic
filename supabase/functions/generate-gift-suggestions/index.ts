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

    const enhancedPrompt = `Based on the request "${prompt}", suggest 8 specific gift ideas that STRICTLY follow these price requirements:

PRICE RULES:
- Every suggestion MUST cost between $${priceRange.min_price.toFixed(2)} and $${priceRange.max_price.toFixed(2)}
- Each suggestion MUST end with the exact price in parentheses
- Example format: "Leather Wallet with RFID Protection ($45.99)"
- Prices must be realistic and market-accurate
- Include the dollar sign and exactly two decimal places
- NO suggestions outside the price range will be accepted

FORMAT REQUIREMENTS:
- Return ONLY a JSON array of strings
- Each string must follow this exact pattern: "Product Name and Description ($XX.XX)"
- The price MUST be the last part in parentheses
- Every price must be between $${priceRange.min_price.toFixed(2)} and $${priceRange.max_price.toFixed(2)}

IMPORTANT:
- Consider age, gender, and occasion mentioned
- Each suggestion must be from a different category
- Include specific product details
- Double-check all prices are within range
- Verify each price before including it

Return EXACTLY 8 suggestions, each with a specific price in parentheses.`;

    console.log('Making DeepSeek API request...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

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
              content: "You are a gift suggestion expert. Price accuracy and format are CRITICAL."
            },
            { role: "user", content: enhancedPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.7
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
      console.log('DeepSeek response received');

      if (!data.choices?.[0]?.message?.content) {
        console.error('Invalid DeepSeek response format:', data);
        throw new Error('Invalid response format from DeepSeek API');
      }

      const suggestions = validateAndCleanSuggestions(data.choices[0].message.content);
      console.log('Validated suggestions:', suggestions);

      if (!suggestions || suggestions.length === 0) {
        throw new Error('No valid suggestions received');
      }

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
      if (error.name === 'AbortError') {
        throw new Error('DeepSeek API request timed out after 30 seconds');
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
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
          'Content-Type': 'application/json'
        }
      }
    );
  }
});