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

    const enhancedPrompt = `You are a gifting expert. Based on the request: "${prompt}", you MUST suggest EXACTLY 8 specific gift ideas.

CRITICAL REQUIREMENTS:
1. You MUST return EXACTLY 8 suggestions - no more, no less
2. Each suggestion must be unique and from different product categories
3. Stay within any budget constraints mentioned (can fluctuate by 20%)
4. Consider age, gender, and occasion mentioned
5. Focus on the recipient's interests and preferences

FORMAT REQUIREMENTS:
1. Return ONLY a JSON array containing EXACTLY 8 strings
2. Each string should be a specific product suggestion
3. Format each suggestion as: "[Brand Name] [Specific Product Name/Model]"
4. Do not include price in the suggestion text
5. Do not include additional commentary or explanations

Example format:
[
  "Sony WH-1000XM4 Wireless Headphones",
  "KitchenAid Artisan Stand Mixer",
  // ... exactly 6 more suggestions
]

IMPORTANT: Your response MUST contain EXACTLY 8 suggestions. If you provide fewer or more than 8 suggestions, your response will be rejected.`;

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
            content: "You are a gift suggestion expert. Staying within a given price range is HIGHLY important to you. You MUST always return EXACTLY 8 suggestions."
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
      throw new Error(`Invalid number of suggestions: ${suggestions?.length ?? 0}. Expected exactly 8 suggestions.`);
    }

    // Process suggestions
    console.log('Processing suggestions:', suggestions);
    const processedProducts = await processSuggestionsInBatches(suggestions);
    console.log('Processed products:', processedProducts);
    
    if (!processedProducts.length) {
      throw new Error('No products found for suggestions');
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