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
            content: `You are a gift suggestion expert. Analyze the recipient's interests, age, gender, and occasion to suggest specific, thoughtful gifts. 
              For each suggestion:
              - Be specific (e.g., "Sony WH-1000XM4 Wireless Headphones" instead of just "headphones")
              - Consider the recipient's interests and lifestyle
              - Include a mix of practical and creative gifts
              - Consider the occasion appropriateness
              - Stay within any specified budget
              - Ensure gender appropriateness
              
              Return ONLY a JSON array of 8 specific gift keywords in this format: ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5", "suggestion6", "suggestion7", "suggestion8"]
              Each suggestion should be searchable on Amazon.
              
              IMPORTANT: Your response must be a valid JSON array containing exactly 8 strings. Do not include any additional text or formatting.`
          },
          { 
            role: "user", 
            content: `${enhancedPrompt}\n\nIMPORTANT: Respond with ONLY a JSON array of strings. No other text.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    try {
      // Try to parse the content directly
      const suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions) || suggestions.length !== 8) {
        throw new Error('Invalid response format: expected array of 8 suggestions');
      }
      
      if (!suggestions.every(item => typeof item === 'string')) {
        throw new Error('Invalid response format: all items must be strings');
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
      
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      throw new Error('Failed to parse gift suggestions from OpenAI response');
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