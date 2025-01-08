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
            content: `You are a gift suggestion expert. You MUST return EXACTLY 8 gift suggestions in a STRICT JSON array format.

CRITICAL REQUIREMENTS:
1. Return EXACTLY 8 items, no more, no less
2. Use ONLY double quotes (") for strings
3. NO special characters in strings
4. Price range must be numbers only (e.g., "50-100")
5. NO line breaks in JSON
6. NO comments or extra text
7. EVERY suggestion MUST have ALL of these fields:
   - "title": specific product name with brand (e.g., "Sony WH-1000XM4 Headphones")
   - "description": clear description (at least 20 words)
   - "priceRange": price range with only numbers (e.g., "50-100")
   - "reason": why this gift is trending (at least 10 words)

Example of EXACT format required (shortened to 2 items for brevity):
[{"title":"Sony WH-1000XM4 Headphones","description":"Premium noise cancelling headphones with industry-leading technology and 30-hour battery life, perfect for music lovers and travelers","priceRange":"250-300","reason":"Top rated for audio quality and consistently ranked as the best noise cancelling headphones"},{"title":"Nintendo Switch OLED","description":"Latest gaming console featuring a vibrant 7-inch OLED screen, enhanced audio, and 64GB storage for ultimate gaming experience","priceRange":"300-350","reason":"Most popular gaming system with strong sales and extensive game library"}]

IMPORTANT: If you cannot generate EXACTLY 8 complete suggestions with ALL required fields, respond with an error message instead.`
          },
          {
            role: "user",
            content: `Generate EXACTLY 8 complete gift suggestions with ALL required fields for: ${prompt}. Remember, each suggestion MUST include title, description, priceRange, and reason.`
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
      
      suggestions = JSON.parse(content);
      console.log('Parsed suggestions:', suggestions);

      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      if (suggestions.length !== 8) {
        throw new Error(`Expected 8 suggestions, got ${suggestions.length}`);
      }

      // Validate each suggestion thoroughly
      suggestions = suggestions.map((suggestion, index) => {
        // Check all required fields exist
        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field] || suggestion[field].trim() === '');
        
        if (missingFields.length > 0) {
          throw new Error(`Suggestion ${index} missing or empty fields: ${missingFields.join(', ')}`);
        }

        // Validate field content
        if (suggestion.description.split(' ').length < 20) {
          throw new Error(`Suggestion ${index} description too short (needs at least 20 words)`);
        }

        if (suggestion.reason.split(' ').length < 10) {
          throw new Error(`Suggestion ${index} reason too short (needs at least 10 words)`);
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