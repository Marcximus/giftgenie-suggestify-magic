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
            content: `You are a gift suggestion expert specializing in trending, popular products. 
            Your task is to generate 8 SPECIFIC gift suggestions in strict JSON format.
            
            IMPORTANT: Use ONLY double quotes (") for ALL strings, NEVER use single quotes (').
            
            Format each suggestion exactly like this, with NO deviations:
            {
              "title": "Specific product name with brand and model",
              "description": "Detailed features and benefits",
              "priceRange": "50-100",
              "reason": "Why this product is trending"
            }
            
            STRICT RULES:
            1. ALL strings MUST use double quotes (")
            2. NEVER use single quotes (')
            3. NO special characters in strings (no ", ', \, or other escape characters)
            4. Price range MUST be numbers only (e.g., "50-100")
            5. Focus on specific, trending products from major brands
            6. Include exact model numbers and versions
            7. NO line breaks within strings
            8. NO markdown formatting
            
            Return ONLY a raw JSON array of suggestions with NO additional text or formatting.`
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
      
      // Clean and normalize the content
      const cleanContent = content
        .replace(/```json\s*/g, '') // Remove JSON code block markers
        .replace(/```\s*$/g, '')    // Remove trailing code block markers
        .replace(/[\n\r]/g, ' ')    // Remove all line breaks
        .replace(/\s+/g, ' ')       // Normalize spaces
        .replace(/'/g, '"')         // Replace any single quotes with double quotes
        .replace(/\\/g, '')         // Remove backslashes
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

      // Validate each suggestion
      suggestions = suggestions.filter((suggestion, index) => {
        try {
          // Check required fields
          const requiredFields = ['title', 'description', 'priceRange', 'reason'];
          const missingFields = requiredFields.filter(field => !suggestion[field]);
          
          if (missingFields.length > 0) {
            console.warn(`Suggestion ${index} missing fields:`, missingFields);
            return false;
          }

          // Validate price range format (numbers only)
          const priceRangeFormat = /^\d+-\d+$/;
          if (!priceRangeFormat.test(suggestion.priceRange)) {
            console.warn(`Suggestion ${index} has invalid price range format:`, suggestion.priceRange);
            return false;
          }

          // Validate string fields
          for (const field of ['title', 'description', 'reason']) {
            if (typeof suggestion[field] !== 'string') {
              console.warn(`Suggestion ${index} field ${field} is not a string:`, suggestion[field]);
              return false;
            }
            
            // Check for problematic characters
            if (suggestion[field].includes('"') || suggestion[field].includes("'") || suggestion[field].includes('\\')) {
              console.warn(`Suggestion ${index} field ${field} contains invalid characters`);
              return false;
            }
          }

          return true;
        } catch (validationError) {
          console.warn(`Validation error for suggestion ${index}:`, validationError);
          return false;
        }
      });

      // Ensure we have enough valid suggestions
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