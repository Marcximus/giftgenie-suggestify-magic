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

    // Enhanced gender and context extraction
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

    const interests = prompt.match(/(?:loves?|enjoys?|likes?)\s+([^,.]+)/gi)?.map(match => 
      match.replace(/(?:loves?|enjoys?|likes?)\s+/i, '').trim()
    ) || [];

    const relationship = prompt.match(/(?:my|for)\s+([^,\s]+)/i)?.[1]?.toLowerCase() || '';
    const ageMatch = prompt.match(/(\d+)(?:\s*-\s*\d+)?\s*years?\s*old/i);
    const age = ageMatch ? ageMatch[1] : '';
    
    const budgetMatch = prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i);
    const minBudget = budgetMatch ? parseInt(budgetMatch[1]) : 25;
    const maxBudget = budgetMatch && budgetMatch[2] ? parseInt(budgetMatch[2]) : minBudget * 1.2;

    // Enhanced gender-specific prompt construction with strict filtering
    const genderContext = isMale ? 'male' : isFemale ? 'female' : 'gender-neutral';
    const genderInstruction = isMale ? 
      `CRITICAL GENDER RESTRICTIONS:
       - ONLY suggest products specifically designed for or marketed to men/boys
       - DO NOT suggest ANY women's products
       - For clothing/accessories, explicitly specify "Men's" in the product name
       - For unisex items, ensure they are appropriate for male users` 
      : isFemale ? 
      `CRITICAL GENDER RESTRICTIONS:
       - ONLY suggest products specifically designed for or marketed to women/girls
       - DO NOT suggest ANY men's products
       - For clothing/accessories, explicitly specify "Women's" in the product name
       - For unisex items, ensure they are appropriate for female users`
      : 'Consider suggesting gender-neutral items appropriate for anyone';

    // Age-specific popular products suggestions
    const ageBasedSuggestions = age ? `
    If the specific interests don't yield enough great options, consider these popular items for ${age}-year-olds:
    ${age < 12 ? `
    - Age-appropriate educational toys and games
    - Popular character merchandise
    - Creative arts and crafts kits
    - Interactive learning tools` 
    : age < 20 ? `
    - Popular tech gadgets and accessories
    - Trending fashion items
    - Gaming related items
    - Popular entertainment merchandise` 
    : age < 35 ? `
    - Smart home devices
    - Premium lifestyle accessories
    - Fitness and wellness products
    - Professional development tools` 
    : age < 60 ? `
    - Health and wellness products
    - Premium home and garden items
    - Hobby-specific premium tools
    - Luxury lifestyle accessories`
    : `
    - Comfort and convenience items
    - Health and wellness products
    - Easy-to-use technology
    - Premium leisure items`}` : '';

    // Book recommendation instruction
    const bookRecommendation = `
    IMPORTANT: If reading or books are mentioned in interests, include at least one book suggestion that matches these criteria:
    - Must be a specific, currently available book (include author name)
    - Match the recipient's interests and age group
    - Consider bestsellers and highly-rated books in their interest areas
    - For fiction, match genre preferences
    - For non-fiction, focus on their specific interests or hobbies`;

    const enhancedPrompt = `As a gift expert specializing in ${interests.join(', ')}, suggest 8 highly specific and personalized gift ideas for a ${age ? `${age}-year-old ` : ''}${relationship} who is passionate about ${interests.join(' and ')}. 

${genderInstruction}

${ageBasedSuggestions}

${bookRecommendation}

Key Requirements:
1. Budget: STRICTLY between $${minBudget} and $${maxBudget}

2. Interest Focus:
   ${interests.map(interest => `- Suggest items that directly relate to ${interest}`).join('\n   ')}
   - Each suggestion must clearly connect to at least one of their interests
   - Include specialty or premium versions of items within their interest areas

3. Gift Categories (focus on their interests):
   - High-quality equipment or gear for their hobbies
   - Premium accessories related to their interests
   - Learning resources or courses in their areas of interest
   - Unique or limited edition items in their preferred categories
   - Experiential gifts related to their passions
   - Specialty or collector's items in their interest areas

4. Quality Guidelines:
   - Suggest only specific products from reputable brands
   - Include model numbers or specific editions
   - Focus on items that enhance their existing interests
   - Emphasize durability and quality within budget
   - Consider items that help them pursue their passions

Format each suggestion as:
"Brand Name Specific Product (Premium/Special Edition) - [Interest] Version"

IMPORTANT: Each suggestion must be:
- Strictly adhere to the gender requirements above
- Directly related to at least one of their stated interests
- Actually available for purchase
- Within the specified budget range
- Specific and detailed enough to find online`;

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

    // Filter products to ensure they match budget constraints
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