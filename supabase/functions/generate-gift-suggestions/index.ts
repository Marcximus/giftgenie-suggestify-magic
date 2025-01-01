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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
            content: "You are a gift suggestion assistant. Generate 8 gift suggestions based on the description provided. When considering budget constraints: If a specific price range is mentioned (e.g., $20-40), suggestions should generally stay within that range but may deviate by up to 20% above or below to include particularly good matches. For example, for a $20-40 range, suggestions between $16-48 would be acceptable. For each suggestion, provide a concise description that explains why this gift would be great. Return a JSON array of objects with these exact fields: title (specific product name), description (brief description that includes why it's a good gift), priceRange (price range with the allowed flexibility), reason (why this gift). Format the response as valid JSON only, with no additional text."
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
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    let suggestions;
    try {
      const content = data.choices[0].message.content.trim();
      console.log('Attempting to parse content:', content);
      suggestions = JSON.parse(content);

      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      // Validate each suggestion has required fields
      suggestions.forEach((suggestion, index) => {
        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Suggestion ${index} is missing required fields: ${missingFields.join(', ')}`);
        }
      });

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI response',
          details: parseError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ suggestions }),
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