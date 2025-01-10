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

    // Enhanced budget extraction with default values
    const budgetMatch = prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i);
    console.log('Budget match:', budgetMatch);
    
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

    // Enhanced interest and context extraction
    const interests = prompt.match(/(?:loves?|enjoys?|likes?)\s+([^,.]+)/gi)?.map(match => 
      match.replace(/(?:loves?|enjoys?|likes?)\s+/i, '').trim()
    ) || [];

    const relationship = prompt.match(/(?:my|for)\s+([^,\s]+)/i)?.[1]?.toLowerCase() || '';
    
    // Construct a more detailed and creative prompt
    const enhancedPrompt = `As a premium gift curator specializing in unique and thoughtful presents, suggest 8 diverse and creative gift ideas that STRICTLY fall within the budget range of $${minBudget} to $${maxBudget}. 

Key Focus: ${interests.join(', ')} for ${relationship}

CRITICAL REQUIREMENTS:
1. Budget Constraints:
   - Every suggestion MUST cost between $${minBudget} and $${maxBudget}
   - Verify prices before suggesting items

2. Gift Categories (Include at least 4 different categories):
   - Gourmet & Culinary: artisanal chocolates, specialty foods, unique snacks
   - Experience Gifts: tasting kits, DIY sets, subscription boxes
   - Personalized Items: custom-made gifts, monogrammed items
   - Wellness & Self-Care: aromatherapy, bath products, comfort items
   - Creative & Hobby: craft supplies, activity sets, creative kits
   - Home & Lifestyle: decor pieces, practical luxuries
   - Unique Finds: unconventional but delightful items
   - Local & Artisanal: handcrafted items, small-batch products

3. Creativity Guidelines:
   - NO generic gift cards or basic items
   - Focus on unique, premium versions of products
   - Include unexpected but delightful combinations
   - Consider seasonal relevance
   - Think beyond obvious choices
   ${interests.map(interest => `   - Incorporate ${interest} in creative ways`).join('\n')}

4. Quality Requirements:
   - Suggest only specific products from reputable brands
   - Include model numbers or specific editions
   - Focus on premium versions within budget
   - Emphasize craftsmanship and quality

Format each suggestion as:
"Brand Name Specific Product (Premium/Special Edition/Version)"

IMPORTANT: Each suggestion must be unique, specific, and actually available for purchase within the budget range.`;

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

    // More lenient budget filtering to account for price variations
    const filteredProducts = products.filter(product => {
      const price = product.amazon_price || parseFloat(product.priceRange.replace(/[^\d.]/g, ''));
      return price >= minBudget * 0.8 && price <= maxBudget * 1.2;
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