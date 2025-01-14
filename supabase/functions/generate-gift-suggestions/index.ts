import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { validateAndCleanSuggestions } from '../_shared/suggestion-validator.ts';
import { processSuggestionsInBatches } from '../_shared/batch-processor.ts';
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { analyzePrompt } from '../_shared/prompt-analyzer.ts';
import { buildGiftPrompt } from '../_shared/prompt-builder.ts';

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

    try {
      // Generate suggestions using OpenAI
      const suggestions = await generateGiftSuggestions(enhancedPrompt);
      console.log('Raw suggestions from OpenAI:', suggestions);

      if (!suggestions || !Array.isArray(suggestions)) {
        console.error('Invalid suggestions format:', suggestions);
        throw new Error('Invalid suggestions format received from OpenAI');
      }

      const validSuggestions = validateAndCleanSuggestions(JSON.stringify(suggestions));
      console.log('Validated suggestions:', validSuggestions);
      
      if (!validSuggestions.length) {
        throw new Error('No valid suggestions generated');
      }
      
      // Process suggestions in parallel batches
      console.log('Processing suggestions in parallel');
      const processedProducts = await processSuggestionsInBatches(validSuggestions);
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
      console.error('Error processing suggestions:', error);
      throw error;
    }

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