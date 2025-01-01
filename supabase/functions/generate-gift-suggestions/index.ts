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
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion assistant. Generate exactly 8 gift suggestions based on the description provided. Return ONLY a raw JSON array of objects with these fields:
            - title: specific product name
            - description: brief description
            - priceRange: price range
            - reason: why this gift`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0,
        frequency_penalty: 0,
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit reached',
          details: 'Please try again in a moment.'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    let suggestions;
    try {
      const content = data.choices[0].message.content.trim();
      suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions) || suggestions.length !== 8) {
        throw new Error('Invalid suggestions format');
      }

      suggestions.forEach((suggestion, index) => {
        if (!suggestion.title || !suggestion.description || !suggestion.priceRange || !suggestion.reason) {
          throw new Error('Missing required fields in suggestion');
        }
      });

    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      throw new Error('Failed to parse AI response');
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'An error occurred while processing your request.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});