import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion expert. Generate SPECIFIC gift suggestions based on the description provided, strictly adhering to the budget mentioned.

            VERY IMPORTANT RULES:
            1. NEVER suggest items outside the specified price range
            2. If a price range is mentioned (e.g., "$20-40" or "Budget: $50-100"), ALL suggestions must fall within that exact range
            3. Research current market prices to ensure suggestions are realistic
            4. If unsure about a price, err on the conservative side
            5. ALWAYS suggest specific product models with brand names, model numbers, or versions
               Example: "Apple AirPods Pro (2nd Generation)" instead of just "wireless earbuds"
               Example: "LEGO Star Wars The Mandalorian Helmet 75328" instead of just "LEGO set"
            6. Focus on products that are likely to be available on Amazon.com
            
            For each suggestion:
            1. Title MUST be a specific product that can be found on Amazon (include brand name, model, version)
            2. Description should explain features and benefits (at least 20 words)
            3. Price range should be realistic and include "USD" prefix
            4. Include a reason why this gift is appropriate
            
            Return EXACTLY 8 suggestions in a JSON array with this format:
            {
              "suggestions": [
                {
                  "title": "specific product name with brand and model",
                  "description": "detailed description",
                  "priceRange": "USD price",
                  "reason": "why this gift is appropriate"
                }
              ]
            }`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    let suggestions;
    try {
      const content = data.choices[0].message.content.trim();
      suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions.suggestions)) {
        throw new Error('Response is not an array');
      }

      // Log the suggestions for debugging
      console.log('Generated suggestions:', JSON.stringify(suggestions, null, 2));

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify(suggestions),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'An error occurred while processing your request.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});