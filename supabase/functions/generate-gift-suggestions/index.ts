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

    // Enhance the prompt with specific instructions about budget and quality
    let enhancedPrompt = `Act as a luxury gift expert. Generate 8 PREMIUM gift suggestions for ${prompt}. 

STRICT REQUIREMENTS:
1. Price Range: Each suggestion MUST be priced between $${minBudget} and $${maxBudget}. DO NOT suggest items below ${minBudget}$.
2. Quality: Focus on premium, high-quality brands and products that would impress the recipient.
3. Specificity: Suggest specific products with brand names (e.g., "Callaway Mavrik Pro Golf Driver" instead of just "golf club")
4. Relevance: Ensure each suggestion directly relates to the recipient's interests
5. Variety: Provide a diverse range of suggestions within the specified category

Format rules:
- Return EXACTLY 8 specific product names
- Format as a JSON array of strings
- Include brand names
- Focus on premium, name-brand items
- Aim for the middle to upper range of the budget

Example format for premium items:
["Nike Air Zoom Alphafly NEXT% Premium Running Shoes", "Garmin Forerunner 955 Solar GPS Smartwatch", "YETI Tundra 45 Hard Cooler"]`;

    if (isMale) {
      enhancedPrompt += "\nIMPORTANT: Only suggest premium gifts appropriate for men/boys. Do not include women's items.";
    } else if (isFemale) {
      enhancedPrompt += "\nIMPORTANT: Only suggest premium gifts appropriate for women/girls. Do not include men's items.";
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