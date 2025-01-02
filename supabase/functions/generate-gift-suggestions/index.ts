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
            content: `You are a gift suggestion expert specializing in trending, popular products from well-known brands. 
            Generate 8 SPECIFIC gift suggestions that are:
            1. Currently trending and popular on major shopping platforms
            2. From recognizable, trusted brands (e.g., Apple, Samsung, Nike, etc.)
            3. Specific models/versions of products (e.g., "Apple AirPods Pro 2nd Generation" instead of just "wireless earbuds")
            4. Available on Amazon with good reviews
            5. Currently in high demand

            For each suggestion, provide:
            - title: Specific product name with brand and model
            - description: Detailed features and benefits
            - priceRange: Realistic price range in "X-Y" format
            - reason: Why this specific product is trending and popular now

            Return ONLY a raw JSON array of suggestions. No markdown, no explanations.
            Ensure all text uses double quotes, not single quotes.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        presence_penalty: 0.3,
        frequency_penalty: 0.5
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
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
      // Clean the content by removing any markdown formatting
      const cleanContent = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();
      
      console.log('Cleaned content:', cleanContent);
      suggestions = JSON.parse(cleanContent);

      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      // Validate each suggestion has required fields
      suggestions = suggestions.filter((suggestion, index) => {
        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Suggestion ${index} missing fields:`, missingFields);
          return false;
        }

        // Validate price range format
        const priceRangeFormat = /^\d+-\d+$/;
        if (!priceRangeFormat.test(suggestion.priceRange)) {
          console.warn(`Suggestion ${index} has invalid price range format:`, suggestion.priceRange);
          return false;
        }

        return true;
      });

      // Ensure we still have enough suggestions
      if (suggestions.length < 4) {
        throw new Error('Not enough valid suggestions generated');
      }

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse suggestions',
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