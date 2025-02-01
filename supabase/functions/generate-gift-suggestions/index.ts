import { corsHeaders } from '../_shared/cors.ts';
import { extractPriceRange } from './priceRangeUtils.ts';
import { supabase } from "@/integrations/supabase/client";

const generateSuggestions = async (prompt: string) => {
  const priceRange = extractPriceRange(prompt);
  
  console.log('Extracted price range from prompt:', priceRange);

  const { data, error } = await supabase.functions.invoke('deep-seek-suggestions', {
    body: { prompt }
  });

  if (error) {
    console.error('Error generating suggestions:', error);
    throw new Error('Failed to generate suggestions');
  }

  const parsedSuggestions = data.suggestions || [];

  // Add price range to the response
  return {
    suggestions: parsedSuggestions,
    priceRange: priceRange || undefined
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    console.log('Received prompt:', prompt);
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const result = await generateSuggestions(prompt);
    
    console.log('Generated suggestions with price range:', {
      suggestionsCount: result.suggestions.length,
      priceRange: result.priceRange
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
