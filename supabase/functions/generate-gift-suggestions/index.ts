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
            content: `You are a gift suggestion expert. Return EXACTLY 8 gift suggestions in a STRICT JSON array format.

Each suggestion must follow this EXACT format with NO DEVIATIONS:
{
  "title": "Specific product name with brand",
  "description": "Clear description of features and benefits",
  "priceRange": "50-100",
  "reason": "Why this gift is trending"
}

CRITICAL RULES:
1. Return ONLY a raw JSON array containing exactly 8 items
2. Use ONLY double quotes (") for strings, NEVER single quotes
3. NO special characters or escape sequences in strings
4. Price range must be numbers only (e.g., "50-100")
5. NO line breaks or extra spaces in the JSON
6. NO comments or additional text
7. NO markdown formatting

Example of valid response:
[{"title":"Sony WH-1000XM4","description":"Premium noise cancelling headphones","priceRange":"250-300","reason":"Top rated for audio quality"},{"title":"Nintendo Switch OLED","description":"Latest gaming console with enhanced display","priceRange":"300-350","reason":"Most popular gaming system"}]`
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
      console.log('Raw content:', content);
      
      // Clean the content
      const cleanContent = content
        .replace(/\s+/g, ' ')  // Normalize spaces
        .trim();
      
      console.log('Cleaned content:', cleanContent);
      
      try {
        suggestions = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Content that failed to parse:', cleanContent);
        throw new Error(`JSON parsing failed: ${parseError.message}`);
      }

      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      if (suggestions.length !== 8) {
        throw new Error(`Expected 8 suggestions, got ${suggestions.length}`);
      }

      // Validate each suggestion
      suggestions = suggestions.map((suggestion, index) => {
        // Check required fields
        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Suggestion ${index} missing fields: ${missingFields.join(', ')}`);
        }

        // Validate price range format
        const priceRangeFormat = /^\d+-\d+$/;
        if (!priceRangeFormat.test(suggestion.priceRange)) {
          throw new Error(`Invalid price range format in suggestion ${index}: ${suggestion.priceRange}`);
        }

        // Validate string fields
        for (const field of ['title', 'description', 'reason']) {
          if (typeof suggestion[field] !== 'string') {
            throw new Error(`Field ${field} in suggestion ${index} is not a string`);
          }
        }

        return suggestion;
      });

    } catch (error) {
      console.error('Failed to process suggestions:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse suggestions',
          details: error.message
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