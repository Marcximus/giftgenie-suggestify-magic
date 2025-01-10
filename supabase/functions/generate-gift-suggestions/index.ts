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

    // Enhanced prompt analysis
    const lowerPrompt = prompt.toLowerCase();
    const hasGender = lowerPrompt.includes('man') || lowerPrompt.includes('woman') || 
                     lowerPrompt.includes('boy') || lowerPrompt.includes('girl');
    const hasAge = /\d+/.test(prompt);
    const hasInterests = lowerPrompt.includes('likes') || lowerPrompt.includes('loves') || 
                        lowerPrompt.includes('enjoys') || lowerPrompt.includes('interested');

    // Default budget range for general queries
    const budgetMatch = prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i);
    const minBudget = budgetMatch ? parseInt(budgetMatch[1]) : 50;
    const maxBudget = budgetMatch && budgetMatch[2] ? parseInt(budgetMatch[2]) : minBudget * 3;

    // Determine gender context
    const isMale = lowerPrompt.includes('man') || lowerPrompt.includes('boy') || 
                  lowerPrompt.includes('father') || lowerPrompt.includes('husband') || 
                  lowerPrompt.includes('boyfriend') || lowerPrompt.includes('brother');

    // For "has everything" type queries, focus on unique and experiential gifts
    const hasEverything = lowerPrompt.includes('has everything') || 
                         lowerPrompt.includes('hard to shop for') || 
                         lowerPrompt.includes('difficult to buy for');

    let enhancedPrompt = `As a luxury gift expert, suggest 8 thoughtful and unique gift ideas `;
    
    if (hasEverything) {
      enhancedPrompt += `for someone who seemingly has everything. Focus on:
      - Unique experiences and services
      - Limited edition or customizable items
      - Innovative new products they might not know about
      - Luxury versions of everyday items
      - Experiential gifts that create memories
      - Personalized or bespoke items
      - Collector's editions or rare finds
      - Items that combine multiple interests\n\n`;
    }

    if (isMale) {
      enhancedPrompt += `CRITICAL: Ensure all suggestions are specifically appropriate for male recipients.\n`;
    }

    enhancedPrompt += `
    Key Requirements:
    1. Budget: Between $${minBudget} and $${maxBudget}
    2. Gift Categories:
       - Premium quality items from reputable brands
       - Unique or limited edition products
       - Experience-based gifts
       - Luxury accessories or gadgets
       - High-end hobby equipment
       - Collector's items
       - Innovative tech products
       - Personalized luxury items

    3. Quality Guidelines:
       - Focus on premium brands and materials
       - Include specific model numbers or editions
       - Emphasize uniqueness and exclusivity
       - Consider items that enhance lifestyle
       - Include at least one experience-based gift
       - Suggest items that show thoughtfulness

    Format each suggestion as:
    "Brand Name Specific Product (Premium/Special Edition) - [Category] Version"

    IMPORTANT: Each suggestion must be:
    - Actually available for purchase
    - Within the specified budget range
    - Specific and detailed enough to find online
    - Unique and memorable`;

    if (isRateLimited()) {
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

    const productPromises = suggestions.map((suggestion, index) => 
      new Promise<GiftSuggestion>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1000));
        const product = await processGiftSuggestion(suggestion);
        resolve(product);
      })
    );

    const products = await Promise.all(productPromises);
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