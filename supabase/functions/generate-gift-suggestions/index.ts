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

    // Extract interests from the prompt
    const interestsMatch = prompt.match(/who likes (.*?) with a budget/i);
    const interests = interestsMatch ? interestsMatch[1].split(' and ') : [];
    console.log('Extracted interests:', interests);

    // Build a more structured prompt that ensures coverage of all interests
    const enhancedPrompt = `Based on the request "${prompt}", suggest 8 highly specific and thoughtful gift ideas that would genuinely delight the recipient.

IMPORTANT TITLE FORMATTING RULES:
1. Format each title as: "[Brand Name] [Essential Model/Product Info] [Key Feature]"
2. Keep titles concise but informative (5-7 words maximum)
3. Include brand name ONLY if it's a well-known brand
4. Include model numbers ONLY if they're significant for identification
5. Focus on the most distinctive feature that sets the product apart
6. Remove unnecessary words like "the", "with", "for", "by"
7. Don't include measurements unless crucial for product identification
8. Don't include years or dates
9. Don't use parentheses or brackets
10. Don't use HTML tags or special characters

EXAMPLES OF GOOD TITLES:
- "Celestron Nature DX Binoculars" (not "Celestron Nature DX 8x42 Binoculars")
- "Harney & Sons London Black Tea" (not "Harney & Sons Tower of London Black Tea")
- "Anti-Squirrel Bird Feeder" (not "The Perky-Pet 114B Squirrel Stumper Bird Feeder")

ADDITIONAL REQUIREMENTS:
1. MUST include at least 2 gifts related to each interest: ${interests.join(', ')}
2. Ensure gifts are appropriate for the specified budget
3. Each suggestion must be from a different product category
4. Avoid similar products or variations of the same item

Return ONLY a JSON array of exactly 8 strings, with no additional text.`;

    console.log('Enhanced prompt:', enhancedPrompt);

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
            content: `You are a gift suggestion expert that follows these rules:
1. ALWAYS consider age, gender, occasion, and budget from the user's request
2. Format titles following the EXACT rules provided
3. Return EXACTLY 8 suggestions in a JSON array
4. Each suggestion must be HIGHLY SPECIFIC
5. DO NOT include any explanatory text or markdown
6. DO NOT use backticks or code blocks
7. ONLY return a raw JSON array of strings
8. Suggest products that would genuinely interest the recipient
9. Consider both mainstream and unique gift ideas
10. MUST include items related to ALL specified interests`
          },
          { role: "user", content: enhancedPrompt }
        ],
        max_tokens: 1000,
        temperature: 1.3,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0].delta.content;
            if (content) buffer += content;
          } catch (e) {
            console.warn('Error parsing chunk:', e);
          }
        }
      }
    }

    // Process complete response
    const suggestions = validateAndCleanSuggestions(buffer);
    console.log('Raw suggestions:', suggestions);
    
    if (!suggestions || suggestions.length !== 8) {
      throw new Error('Did not receive exactly 8 suggestions');
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