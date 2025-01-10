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

    // Enhanced budget extraction with strict validation
    const budgetMatch = prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i);
    console.log('Budget match:', budgetMatch);
    
    if (!budgetMatch) {
      throw new Error('No budget range specified in prompt');
    }

    let minBudget = 0;
    let maxBudget = 1000;

    if (budgetMatch[2]) {
      minBudget = parseInt(budgetMatch[1]);
      maxBudget = parseInt(budgetMatch[2]);
    } else {
      const budget = parseInt(budgetMatch[1]);
      minBudget = budget;
      maxBudget = budget;
    }

    console.log('Parsed budget range:', { minBudget, maxBudget });

    // Enhanced demographic extraction
    const ageMatch = prompt.match(/(\d+)(?:\s*-\s*\d+)?\s*years?\s*old/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;
    
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

    const interestMatch = prompt.match(/who likes\s+([^.]+)/i);
    const interests = interestMatch ? interestMatch[1].trim() : '';
    
    const getAgeGroup = (age: number | null) => {
      if (!age) return 'adult';
      if (age <= 12) return 'child';
      if (age <= 19) return 'teen';
      if (age <= 30) return 'young adult';
      if (age <= 50) return 'adult';
      return 'senior';
    };

    const ageGroup = getAgeGroup(age);

    // Enhanced prompt with strict budget enforcement
    let enhancedPrompt = `As a highly personalized gift curator, suggest 8 premium gift ideas that STRICTLY fall within the budget range of $${minBudget} to $${maxBudget}. ${prompt}

CRITICAL REQUIREMENTS:
1. Budget Constraints (STRICTLY ENFORCED):
   - Every suggestion MUST cost between $${minBudget} and $${maxBudget}
   - DO NOT suggest items outside this range
   - Verify prices before suggesting items
   - If unsure about exact price, err on the side of caution

2. Demographic Customization:
   Age Group (${ageGroup}):
   ${age ? `- Target age: ${age} years old` : ''}
   ${ageGroup === 'young adult' ? '- Focus on trending and innovative products\n   - Consider career and lifestyle needs\n   - Include tech-savvy options' : ''}

3. Gender-Specific Considerations:${
  isMale ? `
   - Focus on masculine preferences
   - Consider modern male interests
   - Emphasize quality and functionality` : 
  isFemale ? `
   - Focus on feminine preferences
   - Consider modern female interests
   - Emphasize style and practicality` : ''}

4. Interest-Based Customization:${interests ? `
   - Primary interests: ${interests}
   - Focus heavily on ${interests}-related items
   - Include premium ${interests} equipment or accessories
   - Consider skill level and experience` : ''}

5. Quality Requirements:
   - Suggest only specific products from reputable brands
   - Include model numbers and key features
   - Focus on latest product versions
   - Emphasize durability and premium quality

IMPORTANT: Each suggestion MUST be a premium product that costs between $${minBudget} and $${maxBudget}. Do not suggest any items outside this range.

Format each suggestion as:
"Brand Model/Edition with Key Feature (Premium Version)"`;

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

    // Process suggestions with delay to avoid rate limits
    const productPromises = suggestions.map((suggestion, index) => {
      return new Promise<GiftSuggestion>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1000));
        const product = await processGiftSuggestion(suggestion);
        resolve(product);
      });
    });

    const products = await Promise.all(productPromises);

    // Filter out products that don't match the budget constraints
    const filteredProducts = products.filter(product => {
      const price = product.amazon_price || parseFloat(product.priceRange.replace(/[^\d.]/g, ''));
      return price >= minBudget && price <= maxBudget;
    });

    return new Response(
      JSON.stringify({ suggestions: filteredProducts }),
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