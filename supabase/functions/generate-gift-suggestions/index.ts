import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { GiftSuggestion } from '../_shared/types.ts';
import { isRateLimited, logRequest, RATE_LIMIT } from '../_shared/rate-limiter.ts';
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { processGiftSuggestion } from '../_shared/product-processor.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    // Extract budget range from the prompt
    const budgetMatch = prompt.match(/budget.*?(\d+)\s*-\s*(\d+)/i);
    const minBudget = budgetMatch ? parseInt(budgetMatch[1]) : 0;
    const maxBudget = budgetMatch ? parseInt(budgetMatch[2]) : 1000;

    // Calculate target price range (focusing on upper 70% of range)
    const targetMinBudget = Math.round(minBudget + (maxBudget - minBudget) * 0.3);
    const targetMaxBudget = maxBudget;

    // Extract gender context
    const isMale = prompt.toLowerCase().includes('brother') || 
                  prompt.toLowerCase().includes('father') || 
                  prompt.toLowerCase().includes('husband') || 
                  prompt.toLowerCase().includes('boyfriend') || 
                  prompt.toLowerCase().includes('son') || 
                  prompt.toLowerCase().includes('grandpa');

    const isFemale = prompt.toLowerCase().includes('sister') || 
                    prompt.toLowerCase().includes('mother') || 
                    prompt.toLowerCase().includes('wife') || 
                    prompt.toLowerCase().includes('girlfriend') || 
                    prompt.toLowerCase().includes('daughter') || 
                    prompt.toLowerCase().includes('grandma');

    // Extract interests
    const interestMatch = prompt.match(/who likes\s+([^.]+)/i);
    const interests = interestMatch ? interestMatch[1].trim() : '';

    // Enhance the prompt with specific instructions about budget and quality
    let enhancedPrompt = `As a luxury gift curator, recommend 8 PREMIUM gift suggestions for ${prompt}. 

STRICT REQUIREMENTS:
1. Budget: Each suggestion MUST be priced between $${targetMinBudget} and $${targetMaxBudget}
   - Focus on the premium end of this range
   - NO items below $${targetMinBudget}
   - Prioritize items in the $${Math.round(targetMinBudget + (targetMaxBudget - targetMinBudget) * 0.3)}-$${targetMaxBudget} range

2. Quality Standards:
   - Only suggest premium, high-end brands
   - Each item must be a specific product (e.g., "TAG Heuer Formula 1 Chronograph 43mm" not just "watch")
   - Include model numbers or specific editions
   - Focus on latest models/versions

3. Interest Alignment:${interests ? `
   - Suggested items must relate to: ${interests}
   - Choose premium items within these interest categories` : ''}

4. Diversity:
   - No duplicate categories
   - Vary price points within the allowed range
   - Mix of practical and aspirational items

Format each suggestion as:
"Brand Model/Edition with Key Premium Feature"

Example premium suggestions:
["YETI Tundra 65 Cooler in Navy with Permafrost Insulation",
 "Garmin Fenix 7X Sapphire Solar Edition with Titanium Band",
 "Sony WH-1000XM5 Wireless Headphones with LDAC Hi-Res Audio"]`;

    if (isMale) {
      enhancedPrompt += "\n\nCRITICAL: Only suggest premium gifts appropriate for men/boys. Focus on masculine aesthetics and preferences. Absolutely no women's items.";
    } else if (isFemale) {
      enhancedPrompt += "\n\nCRITICAL: Only suggest premium gifts appropriate for women/girls. Focus on feminine aesthetics and preferences. Absolutely no men's items.";
    }

    if (isRateLimited()) {
      console.log('Rate limit exceeded, returning 429');
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again in a moment.',
          retryAfter: RATE_LIMIT.RETRY_AFTER
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': RATE_LIMIT.RETRY_AFTER.toString()
          }
        }
      );
    }

    logRequest();

    const suggestions = await generateGiftSuggestions(enhancedPrompt);
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    const productPromises = suggestions.map((suggestion, index) => {
      return new Promise<GiftSuggestion>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1000));
        const product = await processGiftSuggestion(suggestion);
        resolve(product);
      });
    });

    const products = await Promise.all(productPromises);

    return new Response(
      JSON.stringify({ suggestions: products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate gift suggestions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});