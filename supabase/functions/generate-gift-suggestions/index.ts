import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { validateAndCleanSuggestions } from '../_shared/suggestion-validator.ts';
import { processSuggestionsInBatches } from '../_shared/batch-processor.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

serve(async (req) => {
  const startTime = performance.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    // Extract budget from the prompt
    const budgetMatch = prompt.match(/budget(?:\s*of)?\s*(?:USD|\$)?(\d+(?:\s*-\s*\$?\d+)?)/i);
    const budget = budgetMatch ? budgetMatch[1] : null;
    console.log('Extracted budget:', budget);

    let minBudget = 0;
    let maxBudget = 1000;

    if (budget) {
      const budgetParts = budget.split('-').map(part => parseFloat(part.replace(/[^\d.]/g, '')));
      if (budgetParts.length === 2) {
        [minBudget, maxBudget] = budgetParts;
      } else if (budgetParts.length === 1) {
        // If single number, use ±20% range
        const targetBudget = budgetParts[0];
        minBudget = targetBudget * 0.8;
        maxBudget = targetBudget * 1.2;
      }
    }

    const enhancedPrompt = `You are a gifting expert. Based on the request "${prompt}", suggest 8 specific gift ideas.

CRITICAL REQUIREMENTS:
- Budget is STRICTLY ${minBudget}-${maxBudget} USD. DO NOT suggest items outside this range
- Each suggestion must be from a DIFFERENT product category
- Avoid suggesting similar items or variations of the same product
- Consider age, gender, and occasion mentioned
- Focus on premium, highly-rated items within the budget

Return ONLY a JSON array of exactly 8 strings, each following this format:
"[Brand Name] [Specific Product Model] ([Premium/Special Edition if applicable])"

Example format: "Sony WH-1000XM4 Wireless Noise-Cancelling Headphones (Premium Edition)"

IMPORTANT: Each suggestion MUST be priced within ${minBudget}-${maxBudget} USD. Double-check prices before suggesting.`;

    console.log('Enhanced prompt:', enhancedPrompt);

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
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
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const suggestions = validateAndCleanSuggestions(data.choices[0].message.content);
    console.log('Validated suggestions:', suggestions);
    
    if (!suggestions || suggestions.length !== 8) {
      throw new Error('Did not receive exactly 8 suggestions');
    }

    // Process suggestions with budget constraints
    console.log('Processing suggestions with budget constraints:', { minBudget, maxBudget });
    const processedProducts = await processSuggestionsInBatches(suggestions, { minBudget, maxBudget });
    console.log('Processed products:', processedProducts);
    
    if (!processedProducts.length) {
      throw new Error('No products found within budget range');
    }

    // Log metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'success',
      cache_hit: false
    });

    return new Response(
      JSON.stringify({ suggestions: processedProducts }),
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
    
    // Log error metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'error',
      error_message: error.message,
      cache_hit: false
    });
    
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
        },
      }
    );
  }
});