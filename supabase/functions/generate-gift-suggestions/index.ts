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
  console.log('Received request:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400', // 24 hours
      }
    });
  }

  try {
    // Validate OpenAI API key
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    // Parse and validate request body
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      console.error('Invalid prompt received:', prompt);
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

    // Generate suggestions using OpenAI with improved prompt structure
    console.log('Generating suggestions with OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion expert. Your task is to suggest specific, purchasable products that match the given criteria. Follow these rules strictly:

1. Return EXACTLY 8 suggestions
2. Each suggestion must be a specific, real product with brand name and model
3. Format each suggestion as "Brand Product Name/Model"
4. Ensure suggestions match any specified:
   - Budget constraints
   - Age requirements
   - Gender preferences
   - Interest categories
5. Avoid generic descriptions
6. Never repeat suggestions
7. Include only the product names, no additional text

RESPONSE FORMAT:
Your response must be a valid JSON array of strings containing exactly 8 product suggestions.
Example: ["Apple iPhone 14 Pro", "Sony WH-1000XM4 Headphones"]`
          },
          {
            role: "user",
            content: `Generate 8 specific gift suggestions for: ${prompt}\n\nRespond with ONLY a JSON array of strings. No other text.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    let suggestions;
    try {
      const content = data.choices[0].message.content.trim();
      console.log('Parsed content:', content);
      suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    // Process suggestions with delay to avoid rate limits
    console.log('Processing suggestions with Amazon API...');
    const productPromises = suggestions.map((suggestion, index) => {
      return new Promise<GiftSuggestion>(async (resolve) => {
        try {
          // Add delay between requests to avoid rate limits
          await new Promise(r => setTimeout(r, index * 1000));
          const product = await processGiftSuggestion(suggestion);
          resolve(product);
        } catch (error) {
          console.error(`Error processing suggestion "${suggestion}":`, error);
          resolve({
            title: suggestion,
            description: suggestion,
            priceRange: 'Price not available',
            reason: 'This item matches your requirements.',
            search_query: prompt,
            status: 'error'
          });
        }
      });
    });

    const products = await Promise.all(productPromises);
    console.log('Successfully processed all products');

    return new Response(
      JSON.stringify({ suggestions: products }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});