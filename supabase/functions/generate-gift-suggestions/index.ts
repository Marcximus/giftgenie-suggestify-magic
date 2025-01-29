import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { validateAndCleanSuggestions } from '../_shared/suggestion-validator.ts';
import { processSuggestionsInBatches } from '../_shared/batch-processor.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

function extractBudgetFromPrompt(prompt: string): { min: number; max: number } | null {
  // Match common budget patterns
  const patterns = [
    // $50-100 or $50 to $100
    /\$?(\d+)(?:\s*-\s*\$?(\d+)|\s+to\s+\$?(\d+))/i,
    // budget: $50-100 or budget of $50-100
    /budget:?\s*\$?(\d+)(?:\s*-\s*\$?(\d+)|\s+to\s+\$?(\d+))/i,
    // under $100 or below $100
    /(?:under|below)\s+\$?(\d+)/i,
    // $100 or less
    /\$?(\d+)\s+or\s+less/i,
    // around $50
    /around\s+\$?(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match) {
      if (match[2] || match[3]) {
        // Range specified
        const min = parseInt(match[1]);
        const max = parseInt(match[2] || match[3]);
        if (!isNaN(min) && !isNaN(max)) {
          console.log(`Extracted budget range: $${min}-$${max}`);
          return { min, max };
        }
      } else {
        // Single value - create range with ±10%
        const value = parseInt(match[1]);
        if (!isNaN(value)) {
          const min = Math.floor(value * 0.9);
          const max = Math.ceil(value * 1.1);
          console.log(`Created budget range from single value: $${min}-$${max}`);
          return { min, max };
        }
      }
    }
  }

  console.log('No budget constraints found in prompt');
  return null;
}

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

    // Extract budget constraints with improved pattern matching
    const budget = extractBudgetFromPrompt(prompt);
    console.log('Extracted budget constraints:', budget);

    const budgetInstruction = budget 
      ? `CRITICAL: Suggestions MUST be priced between $${budget.min} and $${budget.max}. DO NOT suggest items outside this range.`
      : 'If a budget is specified, suggestions MUST strictly adhere to the given price range.';

    const enhancedPrompt = `You are an gifting expert. Based on the request "${prompt}", suggest 8 specific gift ideas.

Consider:
- Age, gender, and occasion mentioned
- ${budgetInstruction}
- The recipient's interests and preferences
- Avoid suggesting identical items

Return ONLY a JSON array of exactly 8 strings`;

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
            content: "You are a gift suggestion expert. Staying within a given price range is your HIGHEST priority. Never suggest items outside the specified budget range."
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

    // Process suggestions with strict budget constraints
    console.log('Processing suggestions with budget constraints:', { suggestions, budget });
    const processedProducts = await processSuggestionsInBatches(suggestions, budget);
    console.log('Processed products:', processedProducts);
    
    if (!processedProducts.length) {
      throw new Error('No products found within budget constraints');
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