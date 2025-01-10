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

    // Extract budget range from the prompt - now handles more formats
    const budgetMatch = prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i);
    console.log('Budget match:', budgetMatch);
    
    let minBudget = 0;
    let maxBudget = 1000;

    if (budgetMatch) {
      if (budgetMatch[2]) {
        minBudget = parseInt(budgetMatch[1]);
        maxBudget = parseInt(budgetMatch[2]);
      } else {
        const budget = parseInt(budgetMatch[1]);
        minBudget = Math.max(0, budget - (budget * 0.2));
        maxBudget = budget;
      }
    }

    console.log('Parsed budget range:', { minBudget, maxBudget });

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

    // Enhanced prompt for more creative and diverse suggestions
    let enhancedPrompt = `As a highly creative gift curator with expertise in unique and thoughtful presents, suggest 8 truly distinctive gift ideas for ${prompt}. 

STRICT REQUIREMENTS:
1. Budget: Each suggestion MUST be priced between $${minBudget} and $${maxBudget}
   - Spread suggestions across the entire price range
   - NO items outside this range
   - Mix of price points within the range

2. Diversity & Creativity Requirements:
   - Each suggestion MUST be from a different product category
   - Include a mix of mainstream and unique, lesser-known items
   - Focus on innovative, conversation-starting gifts
   - Consider emerging brands and unique artisanal products
   - Include experiential gifts when appropriate
   - Think beyond conventional gift categories

3. Quality Standards:
   - Suggest specific products from both well-known and emerging brands
   - Include model numbers or specific editions when relevant
   - Focus on latest and innovative products

4. Interest Alignment:${interests ? `
   - Use ${interests} as inspiration but think creatively beyond obvious choices
   - Consider unique interpretations of these interests
   - Include surprising but relevant crossover items` : ''}

5. Uniqueness Guidelines:
   - NO generic suggestions
   - NO repetitive items
   - Each item should serve a distinct purpose
   - Include at least 2 unexpected or surprising suggestions
   - Consider items that combine multiple interests in creative ways

Format each suggestion as:
"Brand Model/Edition with Key Feature"

Example of diverse suggestions:
["MasterClass Annual Subscription with Gordon Ramsay Cooking Course",
 "Ember Temperature Control Smart Mug 2 with 3-hour Battery Life",
 "Uncommon Goods Molecular Gastronomy Kit with Recipe Book",
 "Polaroid Hi-Print 2x3 Pocket Photo Printer with Bluetooth"]`;

    if (isMale) {
      enhancedPrompt += "\n\nCRITICAL: Only suggest gifts appropriate for men/boys. Focus on masculine aesthetics while avoiding stereotypes. Think creatively about modern masculine interests.";
    } else if (isFemale) {
      enhancedPrompt += "\n\nCRITICAL: Only suggest gifts appropriate for women/girls. Focus on feminine aesthetics while avoiding stereotypes. Think creatively about modern feminine interests.";
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});