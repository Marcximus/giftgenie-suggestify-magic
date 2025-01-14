import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { validateAndCleanSuggestions } from '../_shared/suggestion-validator.ts';
import { processSuggestionsInBatches } from '../_shared/batch-processor.ts';
import { buildGiftPrompt } from '../_shared/prompt-builder.ts';
import { analyzePrompt } from '../_shared/prompt-analyzer.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    const { prompt, maxBudget } = await req.json();
    console.log('Processing request with prompt:', prompt, 'maxBudget:', maxBudget);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    // Analyze prompt and build enhanced prompt
    const promptAnalysis = analyzePrompt(prompt);
    const enhancedPrompt = buildGiftPrompt(prompt, {
      hasEverything: prompt.toLowerCase().includes('has everything'),
      isMale: promptAnalysis.gender === 'male',
      isFemale: promptAnalysis.gender === 'female',
      minBudget: promptAnalysis.budget.min || 25,
      maxBudget: maxBudget || promptAnalysis.budget.max || 200,
      ageCategory: promptAnalysis.ageCategory,
      occasion: promptAnalysis.occasion
    });

    console.log('Enhanced prompt:', enhancedPrompt);

    // Generate suggestions using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion expert. Your task is to return EXACTLY 8 specific gift suggestions as a JSON array of strings.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON array containing EXACTLY 8 strings
2. Each suggestion must be a specific product (e.g., "Sony WH-1000XM4 Wireless Headphones" not just "headphones")
3. Each suggestion must be searchable on Amazon
4. Do not include any text outside the JSON array
5. Do not include any formatting or explanation

EXAMPLE RESPONSE:
["Sony WH-1000XM4 Wireless Headphones", "Nintendo Switch OLED Model", "Kindle Paperwhite 8GB E-reader", "LEGO Star Wars Millennium Falcon Set", "Apple AirPods Pro (2nd Generation)", "Instant Pot Duo 6-Quart", "Fitbit Charge 5", "Canon EOS Rebel T7 DSLR Camera"]

Remember: Your response must be ONLY a JSON array. No other text or formatting.`
          },
          { 
            role: "user", 
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response data:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid OpenAI response structure');
    }
    
    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    let suggestions;
    try {
      suggestions = JSON.parse(content);
      console.log('Parsed suggestions:', suggestions);
      
      if (!Array.isArray(suggestions)) {
        console.error('Parsed content is not an array:', suggestions);
        throw new Error('Response is not an array');
      }
      
      if (suggestions.length !== 8) {
        console.error('Wrong number of suggestions:', suggestions.length);
        throw new Error(`Expected 8 suggestions, got ${suggestions.length}`);
      }
      
      if (!suggestions.every(item => typeof item === 'string' && item.trim().length > 0)) {
        console.error('Invalid suggestion format:', suggestions);
        throw new Error('All suggestions must be non-empty strings');
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
    
    // Process suggestions in parallel batches
    console.log('Processing suggestions in parallel');
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});