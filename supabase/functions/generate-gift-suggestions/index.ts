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

    // Enhanced demographic and interest extraction
    const ageMatch = prompt.match(/(\d+)(?:\s*-\s*\d+)?\s*years?\s*old/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;
    
    // Gender detection
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

    // Interest extraction with categories
    const interestMatch = prompt.match(/who likes\s+([^.]+)/i);
    const interests = interestMatch ? interestMatch[1].trim() : '';
    
    // Age group categorization for tone adjustment
    const getAgeGroup = (age: number | null) => {
      if (!age) return 'adult';
      if (age <= 12) return 'child';
      if (age <= 19) return 'teen';
      if (age <= 30) return 'young adult';
      if (age <= 50) return 'adult';
      return 'senior';
    };

    const ageGroup = getAgeGroup(age);

    // Enhanced prompt construction with demographic-specific guidance
    let enhancedPrompt = `As a highly personalized gift curator, suggest 8 thoughtfully curated gift ideas ${prompt}. 

DEMOGRAPHIC CUSTOMIZATION:
1. Age Group (${ageGroup}):
   ${age ? `- Target age: ${age} years old` : ''}
   ${ageGroup === 'child' ? '- Focus on educational and developmental value\n   - Ensure age-appropriate safety standards\n   - Include interactive and engaging elements' : ''}
   ${ageGroup === 'teen' ? '- Consider current trends and social factors\n   - Focus on identity expression and peer acceptance\n   - Include tech-savvy and social media relevant items' : ''}
   ${ageGroup === 'young adult' ? '- Focus on lifestyle enhancement and practical value\n   - Consider career and personal development\n   - Include trendy and innovative products' : ''}
   ${ageGroup === 'senior' ? '- Prioritize ease of use and practicality\n   - Consider comfort and quality of life\n   - Include items that promote activity and engagement' : ''}

2. Budget Requirements:
   - Price range: $${minBudget} to $${maxBudget}
   - Spread suggestions across the entire price range
   - Ensure value proposition matches price point

3. Interest-Based Customization:${interests ? `
   - Primary interests: ${interests}
   - Suggest items that combine multiple interests
   - Include complementary activities and accessories
   - Consider skill level and experience` : ''}

4. Gender-Specific Considerations:${
  isMale ? `
   - Focus on masculine aesthetics while avoiding stereotypes
   - Consider modern male interests and lifestyle
   - Include innovative takes on traditional male-oriented gifts` :
  isFemale ? `
   - Focus on feminine aesthetics while avoiding stereotypes
   - Consider modern female interests and lifestyle
   - Include innovative takes on traditional female-oriented gifts` : ''
}

5. Quality and Relevance:
   - Suggest specific products from reputable brands
   - Include model numbers and key features
   - Focus on latest and innovative products
   - Consider durability and long-term value

6. Personalization Factors:
   - Match gift sophistication to age group
   - Consider lifestyle and daily routines
   - Include items that encourage personal growth
   - Focus on creating meaningful experiences

Format each suggestion as:
"Brand Model/Edition with Key Feature"`;

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