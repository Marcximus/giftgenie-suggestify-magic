import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { GiftSuggestion } from '../_shared/types.ts';
import { isRateLimited, logRequest, RATE_LIMIT } from '../_shared/rate-limiter.ts';
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { processGiftSuggestion } from '../_shared/product-processor.ts';
import { buildGiftPrompt } from '../_shared/prompt-builder.ts';
import { filterProducts } from '../_shared/product-filter.ts';
import { analyzePrompt } from '../_shared/prompt-analyzer.ts';

interface AmazonProduct {
  title: string;
  image_url?: string;
  price?: number;
  rating?: number;
  total_ratings?: number;
  url?: string;
  asin?: string;
}

async function searchAmazonProducts(keyword: string): Promise<AmazonProduct | null> {
  console.log('Searching with term:', keyword);
  
  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(keyword)}&country=US`;
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error(`API error for keyword ${keyword}:`, response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data?.data?.products?.[0]) {
      console.log('No product found, trying simplified search');
      // Try a simplified search by taking the first few words
      const simplifiedKeyword = keyword.split(' ').slice(0, 3).join(' ');
      if (simplifiedKeyword !== keyword) {
        return searchAmazonProducts(simplifiedKeyword);
      }
      return null;
    }

    const product = data.data.products[0];
    
    // Extract and validate required fields
    const formattedProduct: AmazonProduct = {
      title: product.product_title || keyword,
      image_url: product.product_photo || null,
      price: product.product_price ? 
        parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : 
        undefined,
      rating: product.product_star_rating ? 
        parseFloat(product.product_star_rating) : 
        undefined,
      total_ratings: product.product_num_ratings ? 
        parseInt(product.product_num_ratings.toString(), 10) : 
        undefined,
      url: product.product_url,
      asin: product.asin
    };

    // Validate minimum required fields
    if (!formattedProduct.title || (!formattedProduct.image_url && !formattedProduct.asin)) {
      console.error(`Missing required fields for keyword ${keyword}`);
      return null;
    }

    return formattedProduct;
  } catch (error) {
    console.error(`Error searching for keyword ${keyword}:`, error);
    return null;
  }
}

serve(async (req) => {
  const startTime = performance.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    // Analyze the prompt first
    const promptAnalysis = analyzePrompt(prompt);
    console.log('Prompt analysis:', promptAnalysis);

    const minBudget = promptAnalysis.budget.min || 50;
    const maxBudget = promptAnalysis.budget.max || 200;

    const enhancedPrompt = buildGiftPrompt(prompt, {
      hasEverything: prompt.toLowerCase().includes('has everything') || 
                     prompt.toLowerCase().includes('owns everything'),
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

    // Process suggestions in parallel with batching
    console.log('Processing suggestions in parallel');
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < suggestions.length; i += batchSize) {
      const batch = suggestions.slice(i, i + batchSize);
      batches.push(batch);
    }

    const processedSuggestions: GiftSuggestion[] = [];
    
    for (const batch of batches) {
      console.log(`Processing batch of ${batch.length} suggestions`);
      const batchResults = await Promise.all(
        batch.map(async (suggestion) => {
          try {
            return await processGiftSuggestion(suggestion);
          } catch (error) {
            console.error('Error processing suggestion:', error);
            return null;
          }
        })
      );
      
      processedSuggestions.push(...batchResults.filter((result): result is GiftSuggestion => result !== null));
      
      // Add a small delay between batches to avoid rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const filteredProducts = filterProducts(processedSuggestions, minBudget, maxBudget);
    console.log('Filtered products:', filteredProducts);

    // Log successful processing
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'success',
      cache_hit: false
    });

    return new Response(
      JSON.stringify({ suggestions: filteredProducts.length > 0 ? filteredProducts : processedSuggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
    // Log error metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'error',
      error_message: error.message,
      cache_hit: false
    });
    
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