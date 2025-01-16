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
            content: `You are a gift suggestion expert. Your task is to provide 8 specific gift suggestions that are perfectly balanced and varied:

CRITICAL REQUIREMENTS:
1. PROVIDE EXACTLY 8 SUGGESTIONS:
   - 5 suggestions MUST be directly related to the stated interests/occasion (while still taking gender and age into consideration)
   - 3 suggestions MUST be age-appropriate general gifts (while still taking gender into consideration)
   
2. ENSURE MAXIMUM VARIETY:
   - No duplicate product categories (e.g., don't suggest multiple speakers or notebooks)
   - Vary brands and price points within the budget
   - Include a mix of mainstream and unique/niche products
   - Consider different aspects of the recipient's interests
   
3. CONSIDER DEMOGRAPHICS AND OCCASION:
   - All suggestions must be gender-appropriate
   - All suggestions must be age-appropriate
   - If an occasion is specified (e.g., Valentine's Day, Wedding), include relevant themed items
   - Ensure suggestions align with the occasion's sentiment and traditions
   
4. BE SPECIFIC WITH PRODUCT DETAILS:
   - ALWAYS include brand names and model numbers/versions when applicable
   - Use exact product names (e.g., "Sony WH-1000XM4 Wireless Headphones" not just "headphones")
   - Include special editions or variants if relevant
   - Each suggestion must be easily searchable on Amazon
   - Format: "[Brand Name] [Product Name] [Model/Version] ([Special Edition] if applicable)"

5. ENSURE SUGGESTION DIVERSITY:
   - Mix physical products with experiences or subscriptions
   - Include both practical and sentimental options
   - Vary between tech, lifestyle, hobby, and personal items
   - Consider both immediate enjoyment and long-term value

Return ONLY a JSON array of 8 specific gift suggestions in this format:
["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5", "suggestion6", "suggestion7", "suggestion8"]

DO NOT include any additional text, formatting, or explanations.`
          },
          { 
            role: "user", 
            content: `${enhancedPrompt}\n\nIMPORTANT: Return ONLY a JSON array of 8 strings. No other text.` 
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));
    
    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    let suggestions;
    try {
      // Try to parse the content directly
      suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions)) {
        console.error('Invalid response format: not an array', suggestions);
        throw new Error('Invalid response format: expected array');
      }
      
      if (suggestions.length !== 8) {
        console.error('Invalid response format: wrong length', suggestions.length);
        throw new Error('Invalid response format: expected array of 8 suggestions');
      }
      
      if (!suggestions.every(item => typeof item === 'string' && item.trim().length > 0)) {
        console.error('Invalid response format: invalid items', suggestions);
        throw new Error('Invalid response format: all items must be non-empty strings');
      }
      
      // Clean up suggestions
      suggestions = suggestions.map(s => s.trim());
      
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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      console.error('Content that failed to parse:', content);
      throw new Error(`Failed to parse gift suggestions: ${e.message}`);
    }

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});