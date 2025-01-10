import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { processGiftSuggestion } from '../_shared/product-processor.ts';
import { GiftSuggestion } from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Enhanced gender detection
    const maleRecipients = ['brother', 'father', 'husband', 'boyfriend', 'son', 'grandpa', 'uncle', 'nephew', 'male'];
    const femaleRecipients = ['sister', 'mother', 'wife', 'girlfriend', 'daughter', 'grandma', 'aunt', 'niece', 'female'];
    
    const promptLower = prompt.toLowerCase();
    const isMaleRecipient = maleRecipients.some(term => promptLower.includes(term));
    const isFemaleRecipient = femaleRecipients.some(term => promptLower.includes(term));
    
    // Extract other parameters
    const ageMatch = prompt.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:year|years|yr|yrs)?(?:\s*old)?/i);
    const interestsMatch = prompt.match(/(?:loves?|enjoys?|likes?)\s+([^,.]+)/i);
    const budgetMatch = prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i);

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

    // Construct a more specific prompt with strict gender guidelines
    const genderContext = isMaleRecipient ? 'male' : isFemaleRecipient ? 'female' : 'gender-neutral';
    const genderInstruction = isMaleRecipient ? 
      'CRITICAL: Only suggest gifts that are appropriate and appealing for male recipients. Avoid items typically marketed to women.' :
      isFemaleRecipient ?
      'CRITICAL: Only suggest gifts that are appropriate and appealing for female recipients. Avoid items typically marketed to men.' :
      'Suggest gender-neutral gifts that would appeal to any recipient.';

    const enhancedPrompt = `As a premium gift curator, suggest 8 highly specific and personalized gift ideas that STRICTLY match these criteria:

${ageMatch ? `Age Range: ${ageMatch[1]}${ageMatch[2] ? `-${ageMatch[2]}` : ''} years old
- Focus on age-appropriate items
- Consider generational preferences and trends` : ''}

Recipient Gender: ${genderContext}
${genderInstruction}
- Ensure all suggestions align with ${genderContext} preferences
- Consider gender-specific trends and interests

${interestsMatch ? `Key Interests: ${interestsMatch[1]}
- Prioritize items directly related to ${interestsMatch[1]}
- Include complementary items that enhance the ${interestsMatch[1]} experience
- Consider both equipment and accessories related to ${interestsMatch[1]}` : ''}

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

    console.log('Enhanced prompt:', enhancedPrompt);

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

      // Score the product relevance
      let relevanceScore = withinBudget ? 1 : 0;
      
      // Add to score based on matching criteria
      if (interestsMatch && product.description.toLowerCase().includes(interestsMatch[1].toLowerCase())) {
        relevanceScore += 1;
      }

      // Gender-specific scoring
      const productDesc = (product.description + ' ' + product.title).toLowerCase();
      if (isMaleRecipient && femaleRecipients.some(term => productDesc.includes(term))) {
        relevanceScore = 0; // Exclude products with female-specific terms for male recipients
      }
      if (isFemaleRecipient && maleRecipients.some(term => productDesc.includes(term))) {
        relevanceScore = 0; // Exclude products with male-specific terms for female recipients
      }
      
      return relevanceScore > 0;
    });

    // Sort by relevance and price
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