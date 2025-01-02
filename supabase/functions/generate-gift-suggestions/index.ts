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
    const { prompt } = await req.json();

    // Input validation
    if (!prompt || typeof prompt !== 'string' || prompt.length > 500) {
      throw new Error('Invalid prompt: Must be a string under 500 characters');
    }

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
            Generate 8 specific gift suggestions based on the description provided. 
            
            Guidelines for suggestions:
            1. Focus on actual products from real, popular brands
            2. Include current trending products and bestsellers
            3. Mention specific models, versions, or editions
            4. Include product features that make it appealing
            
            For each suggestion, provide:
            - title (specific product name with brand)
            - description (detailed features and benefits)
            - priceRange (format as "X-Y", numbers only, e.g. "20-30")
            - reason (why this specific product is trending/popular)
            
            Return ONLY a raw JSON array of objects with double quotes for all strings. No markdown, no code blocks.
            Example format:
            [
              {
                "title": "Apple AirPods Pro (2nd Generation)",
                "description": "Wireless earbuds with active noise cancellation",
                "priceRange": "200-250",
                "reason": "Latest model with improved features"
              }
            ]`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.6,
        max_tokens: 1500,
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
      // Clean the response content and ensure proper JSON formatting
      const content = data.choices[0].message.content
        .trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .replace(/(\r\n|\n|\r)/gm, '')  // Remove line breaks
        .replace(/\s+/g, ' ')           // Normalize spaces
        .trim();
      
      console.log('Cleaned content:', content);
      suggestions = JSON.parse(content);

      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      // Validate each suggestion
      suggestions = suggestions.filter((suggestion, index) => {
        if (!suggestion || typeof suggestion !== 'object') {
          console.warn(`Suggestion ${index} is not an object`);
          return false;
        }

        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Suggestion ${index} missing fields:`, missingFields);
          return false;
        }

        // Validate priceRange format
        const priceRange = suggestion.priceRange.toString().replace(/[^0-9-]/g, '');
        const [min, max] = priceRange.split('-').map(n => parseInt(n));
        
        if (!min || !max || min >= max) {
          console.warn(`Suggestion ${index} has invalid price range:`, suggestion.priceRange);
          return false;
        }

        // Ensure all string fields use double quotes
        requiredFields.forEach(field => {
          if (typeof suggestion[field] === 'string') {
            suggestion[field] = suggestion[field].replace(/'/g, '"');
          }
        });

        return true;
      });

      if (suggestions.length < 4) {
        throw new Error('Not enough valid suggestions generated');
      }

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse suggestions: ' + parseError.message);
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