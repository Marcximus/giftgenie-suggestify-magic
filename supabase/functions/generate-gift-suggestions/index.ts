import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    // Verify OpenAI API key is present
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
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
            content: `You are a gift suggestion assistant. Generate exactly 3 gift suggestions based on the description provided. 
            Format your response as a JSON array of objects, where each object has these exact fields:
            - title: A short, clear name for the gift
            - description: A brief description of the gift
            - priceRange: An estimated price range (e.g., "$20-$30")
            - reason: Why this gift would be a good fit`
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

    if (response.status === 429) {
      console.error('OpenAI rate limit reached');
      return new Response(
        JSON.stringify({
          error: 'Rate limit reached',
          details: 'The service is experiencing high demand. Please wait a moment and try again.'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    let suggestions;
    try {
      suggestions = JSON.parse(data.choices[0].message.content);
      
      if (!Array.isArray(suggestions) || suggestions.length !== 3) {
        throw new Error('Invalid suggestions format');
      }

      suggestions.forEach(suggestion => {
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
      details: 'An error occurred while processing your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});