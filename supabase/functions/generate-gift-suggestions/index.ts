import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { processGiftSuggestion } from '../_shared/product-processor.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { GiftSuggestion } from '../_shared/types.ts';

const RATE_LIMIT = {
  MAX_REQUESTS: 50,
  WINDOW_MS: 60000, // 1 minute
  RETRY_AFTER: 60, // seconds
};

const requests: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  // Remove requests older than the window
  while (requests.length > 0 && requests[0] < now - RATE_LIMIT.WINDOW_MS) {
    requests.shift();
  }
  return requests.length >= RATE_LIMIT.MAX_REQUESTS;
}

function logRequest() {
  requests.push(Date.now());
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // Verify OpenAI API key is configured
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limiting
    if (isRateLimited()) {
      console.log('Rate limit exceeded');
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
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

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    // Extract budget range from the prompt
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

    let enhancedPrompt = `As a gift curator, recommend 8 thoughtful gift suggestions for ${prompt}. 

STRICT REQUIREMENTS:
1. Budget: Each suggestion MUST be priced between $${minBudget} and $${maxBudget}
   - Spread suggestions across the entire price range
   - NO items outside this range
   - Mix of price points within the range

2. Quality Standards:
   - Suggest specific products from well-known brands
   - Each item must be a specific product (e.g., "TAG Heuer Formula 1 Chronograph 43mm" not just "watch")
   - Include model numbers or specific editions
   - Focus on latest models/versions

3. Interest Alignment:${interests ? `
   - Suggested items must relate to: ${interests}
   - Choose quality items within these interest categories` : ''}

4. Diversity:
   - No duplicate categories
   - Vary price points within the allowed range
   - Mix of practical and fun items`;

    if (isMale) {
      enhancedPrompt += "\n\nCRITICAL: Only suggest gifts appropriate for men/boys. Focus on masculine aesthetics and preferences. Absolutely no women's items.";
    } else if (isFemale) {
      enhancedPrompt += "\n\nCRITICAL: Only suggest gifts appropriate for women/girls. Focus on feminine aesthetics and preferences. Absolutely no men's items.";
    }

    console.log('Generating suggestions with prompt:', enhancedPrompt);

    const suggestions = await generateGiftSuggestions(enhancedPrompt);
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    console.log('Raw suggestions:', suggestions);

    const productPromises = suggestions.map((suggestion, index) => {
      return new Promise<GiftSuggestion>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1000));
        try {
          const product = await processGiftSuggestion(suggestion);
          resolve(product);
        } catch (error) {
          console.error('Error processing suggestion:', error);
          // Return the original suggestion without Amazon data
          resolve({
            title: suggestion,
            description: suggestion,
            priceRange: `$${minBudget}-${maxBudget}`,
            reason: 'Suggested based on your interests',
            search_query: prompt
          });
        }
      });
    });

    const products = await Promise.all(productPromises);

    return new Response(
      JSON.stringify({ suggestions: products }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
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