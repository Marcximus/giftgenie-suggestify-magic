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
            content: `You are a gift suggestion expert. Your task is to provide 8 specific gift suggestions based on the user's request.

CRITICAL REQUIREMENTS:
1. ALWAYS return EXACTLY 8 suggestions
2. Format each suggestion as a specific product (e.g., "Sony WH-1000XM4 Wireless Headphones" not just "headphones")
3. Include brand names when possible
4. Make suggestions searchable on Amazon
5. Ensure suggestions are age and gender appropriate
6. Stay within the specified budget
7. Avoid duplicate product categories

RESPONSE FORMAT:
- Return ONLY a JSON array of 8 strings
- No markdown, no code blocks, no explanatory text
- Example: ["Product 1", "Product 2", "Product 3", "Product 4", "Product 5", "Product 6", "Product 7", "Product 8"]`
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
    console.log('OpenAI response:', JSON.stringify(data, null, 2));
    
    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    // Enhanced cleaning of the response
    const cleanedContent = content
      .replace(/```json\s*/g, '')    // Remove ```json
      .replace(/```\s*/g, '')        // Remove remaining ```
      .replace(/`/g, '')             // Remove any single backticks
      .replace(/^\s*\[\s*/, '[')     // Clean up leading whitespace before array
      .replace(/\s*\]\s*$/, ']')     // Clean up trailing whitespace after array
      .trim();
    
    console.log('Cleaned content:', cleanedContent);
    
    let suggestions;
    try {
      suggestions = JSON.parse(cleanedContent);
      
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
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          } 
        }
      );
      
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      console.error('Content that failed to parse:', cleanedContent);
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
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
      }
    );
  }
});