import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid prompt',
          details: 'Please provide a more specific gift request'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Enhanced parameter extraction
    const ageMatch = prompt.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:year|years|yr|yrs)?(?:\s*old)?/i);
    const genderMatch = prompt.match(/(?:brother|sister|mother|father|son|daughter|husband|wife|boyfriend|girlfriend)/i);
    const interestsMatch = prompt.match(/(?:loves?|enjoys?|likes?)\s+([^,.]+)/i);
    const budgetMatch = prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i);

    // Extract parameters with defaults
    const age = {
      min: ageMatch ? parseInt(ageMatch[1]) : null,
      max: ageMatch?.[2] ? parseInt(ageMatch[2]) : (ageMatch ? parseInt(ageMatch[1]) : null)
    };

    const gender = genderMatch ? genderMatch[0].toLowerCase() : null;
    const interests = interestsMatch ? interestsMatch[1].trim() : null;
    
    let minBudget = 25;
    let maxBudget = 100;

    if (budgetMatch) {
      if (budgetMatch[2]) {
        minBudget = parseInt(budgetMatch[1]);
        maxBudget = parseInt(budgetMatch[2]);
      } else {
        const budget = parseInt(budgetMatch[1]);
        minBudget = budget * 0.8;
        maxBudget = budget * 1.2;
      }
    }

    // Construct an enhanced prompt with specific instructions based on extracted parameters
    const enhancedPrompt = `As a premium gift curator, suggest 8 highly specific and personalized gift ideas that STRICTLY match these criteria:

${age.min ? `Age Range: ${age.min}${age.max ? `-${age.max}` : ''} years old
- Focus on age-appropriate items
- Consider generational preferences and trends` : ''}

${gender ? `Recipient: ${gender}
- Ensure suggestions align with typical ${gender} preferences
- Consider gender-specific trends and interests` : ''}

${interests ? `Key Interests: ${interests}
- Prioritize items directly related to ${interests}
- Include complementary items that enhance the ${interests} experience
- Consider both equipment and accessories related to ${interests}` : ''}

Budget Constraints: $${minBudget} - $${maxBudget}
- Every suggestion MUST fall within this exact price range
- Prioritize best value items within the range
- Include a mix of price points within the range

Additional Requirements:
1. Each suggestion must be a specific product (brand name, model number)
2. Focus on currently trending and highly-rated items
3. Include a mix of:
   - Premium versions of everyday items
   - Unique, specialized products
   - Popular, well-reviewed items
   - Innovative new releases
4. Avoid generic suggestions
5. Ensure each item has strong relevance to the recipient's profile

Format each suggestion as:
"Brand Name Specific Product Model/Version (with key feature)"`;

    if (isRateLimited()) {
      console.log('Rate limit exceeded, returning 429');
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
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

    // Enhanced filtering based on extracted parameters
    const filteredProducts = products.filter(product => {
      const price = product.amazon_price || parseFloat(product.priceRange.replace(/[^\d.]/g, ''));
      const withinBudget = price >= minBudget * 0.8 && price <= maxBudget * 1.2;

      // Score the product relevance (basic implementation)
      let relevanceScore = withinBudget ? 1 : 0;
      
      // Add to score based on matching criteria
      if (interests && product.description.toLowerCase().includes(interests.toLowerCase())) {
        relevanceScore += 1;
      }
      
      // Require a minimum relevance score
      return relevanceScore > 0;
    });

    // Sort by relevance (can be enhanced further)
    filteredProducts.sort((a, b) => {
      const priceA = a.amazon_price || parseFloat(a.priceRange.replace(/[^\d.]/g, ''));
      const priceB = b.amazon_price || parseFloat(b.priceRange.replace(/[^\d.]/g, ''));
      
      // Prefer items closer to the middle of the budget range
      const targetPrice = (minBudget + maxBudget) / 2;
      const priceDiffA = Math.abs(priceA - targetPrice);
      const priceDiffB = Math.abs(priceB - targetPrice);
      
      return priceDiffA - priceDiffB;
    });

    return new Response(
      JSON.stringify({ suggestions: filteredProducts.length > 0 ? filteredProducts : products }),
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