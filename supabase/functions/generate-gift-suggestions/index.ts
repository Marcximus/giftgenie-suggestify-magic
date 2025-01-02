import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to validate price range
const validatePriceRange = (suggestion: any, originalRange: string): boolean => {
  const [minStr, maxStr] = originalRange.split('-').map(n => parseInt(n));
  const min = minStr * 0.8;  // 20% below minimum
  const max = maxStr * 1.2;  // 20% above maximum
  
  // Extract numeric values from the suggestion's price range
  const suggestedPrice = suggestion.priceRange.replace(/[^0-9-]/g, '');
  const [suggestedMin, suggestedMax] = suggestedPrice.split('-').map(n => parseInt(n));
  
  return suggestedMin >= min && suggestedMax <= max;
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

    // Extract price range from prompt if it exists
    const priceRangeMatch = prompt.match(/Budget:\s*\$?(\d+-\d+)/i);
    const originalPriceRange = priceRangeMatch ? priceRangeMatch[1] : null;
    console.log('Extracted price range:', originalPriceRange);

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
            content: `You are a gift suggestion assistant. Generate 8 gift suggestions based on the description provided. STRICT BUDGET RULE: When a price range is mentioned (e.g., $20-40), you MUST ensure ALL suggestions stay within 20% of the range bounds. Example: for $20-40, suggestions MUST be between $16-48, no exceptions. For each suggestion, provide: title (specific product name), description (brief description), priceRange (actual price range, format as 'X-Y'), and reason (why this gift). Return ONLY a raw JSON array. No markdown, no code blocks, just the array. Response must be valid JSON.`
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

      // Validate each suggestion has required fields and price range
      suggestions = suggestions.filter((suggestion, index) => {
        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Suggestion ${index} missing fields:`, missingFields);
          return false;
        }

        // If we have an original price range, validate the suggestion's price
        if (originalPriceRange && !validatePriceRange(suggestion, originalPriceRange)) {
          console.warn(`Suggestion ${index} outside price range:`, suggestion.priceRange);
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