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

    // Generate suggestions using OpenAI with strict JSON formatting
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
            content: `You are a gift suggestion expert that ONLY returns a JSON array of 8 specific gift suggestions.
            
CRITICAL: Your response must be a valid JSON array containing EXACTLY 8 strings.
DO NOT include any explanatory text, markdown formatting, or other content.
DO NOT apologize or explain your suggestions.
DO NOT use backticks or code blocks.
ONLY return a raw JSON array like this: ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5", "suggestion6", "suggestion7", "suggestion8"]

Each suggestion must be:
- A specific product with brand name and model when applicable
- Searchable on Amazon
- Within the specified budget range
- Appropriate for the recipient's age and gender
- Different from other suggestions (no duplicates)
- No generic descriptions`
          },
          { 
            role: "user", 
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI raw response:', data);
    
    const content = data.choices[0].message.content.trim();
    console.log('Content from OpenAI:', content);
    
    // Validate and clean the suggestions
    const suggestions = validateAndCleanSuggestions(content);
    console.log('Validated suggestions:', suggestions);
    
    if (!suggestions || suggestions.length !== 8) {
      throw new Error('Invalid number of suggestions received');
    }

    // Process suggestions in parallel batches
    console.log('Processing suggestions in parallel:', suggestions);
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