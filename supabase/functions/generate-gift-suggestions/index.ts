import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { GiftSuggestion } from '../_shared/types.ts';
import { isRateLimited, logRequest, RATE_LIMIT } from '../_shared/rate-limiter.ts';
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { processGiftSuggestion } from '../_shared/product-processor.ts';
import { buildGiftPrompt } from '../_shared/prompt-builder.ts';
import { filterProducts } from '../_shared/product-filter.ts';

// Define the analyzePrompt function inline since it's not being properly imported
function analyzePrompt(prompt: string) {
  const analysis = {
    hasAge: false,
    age: null as number | null,
    ageCategory: null as string | null,
    gender: null as string | null,
    interests: [] as string[],
    budget: {
      min: null as number | null,
      max: null as number | null
    }
  };

  // Age detection
  const ageMatch = prompt.match(/\b(\d+)\s*(year|years|yr|yrs|month|months|mo|mos)?\s*(old)?\b/i);
  if (ageMatch) {
    analysis.hasAge = true;
    const age = parseInt(ageMatch[1]);
    analysis.age = age;

    // Determine age category
    if (ageMatch[2]?.toLowerCase().includes('month')) {
      analysis.ageCategory = 'infant';
    } else if (age <= 2) {
      analysis.ageCategory = 'infant';
    } else if (age <= 12) {
      analysis.ageCategory = 'child';
    } else if (age <= 19) {
      analysis.ageCategory = 'teen';
    } else if (age >= 65) {
      analysis.ageCategory = 'senior';
    } else {
      analysis.ageCategory = 'adult';
    }
  }

  // Gender detection
  const maleTerms = ['male', 'man', 'boy', 'husband', 'boyfriend', 'father', 'dad', 'brother', 'uncle', 'grandfather', 'grandpa'];
  const femaleTerms = ['female', 'woman', 'girl', 'wife', 'girlfriend', 'mother', 'mom', 'sister', 'aunt', 'grandmother', 'grandma'];

  const words = prompt.toLowerCase().split(/\s+/);
  if (maleTerms.some(term => words.includes(term))) {
    analysis.gender = 'male';
  } else if (femaleTerms.some(term => words.includes(term))) {
    analysis.gender = 'female';
  }

  // Budget detection
  const budgetMatch = prompt.match(/\$(\d+)(?:\s*-\s*\$?(\d+))?/);
  if (budgetMatch) {
    analysis.budget.min = parseInt(budgetMatch[1]);
    analysis.budget.max = budgetMatch[2] ? parseInt(budgetMatch[2]) : analysis.budget.min * 1.5;
  }

  console.log('Prompt analysis result:', analysis);
  return analysis;
}

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

    // Analyze the prompt first
    const promptAnalysis = analyzePrompt(prompt);
    console.log('Prompt analysis:', promptAnalysis);

    // Default budget range for general queries
    const minBudget = promptAnalysis.budget.min || 50;
    const maxBudget = promptAnalysis.budget.max || 200;

    const enhancedPrompt = buildGiftPrompt(prompt, {
      hasEverything: prompt.toLowerCase().includes('has everything') || prompt.toLowerCase().includes('owns everything'),
      isMale: promptAnalysis.gender === 'male',
      isFemale: promptAnalysis.gender === 'female',
      minBudget,
      maxBudget,
      ageCategory: promptAnalysis.ageCategory
    });

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

    console.log('Enhanced prompt:', enhancedPrompt);
    const suggestions = await generateGiftSuggestions(enhancedPrompt);
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    console.log('Raw suggestions:', suggestions);

    const productPromises = suggestions.map((suggestion, index) => 
      new Promise<GiftSuggestion>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1000));
        const product = await processGiftSuggestion(suggestion);
        resolve(product);
      })
    );

    const products = await Promise.all(productPromises);
    console.log('Processed products:', products);

    const filteredProducts = filterProducts(products, minBudget, maxBudget);
    console.log('Filtered products:', filteredProducts);

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