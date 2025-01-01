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
  
  const suggestedPrice = suggestion.priceRange.replace(/[^0-9-]/g, '');
  const [suggestedMin, suggestedMax] = suggestedPrice.split('-').map(n => parseInt(n));
  
  return suggestedMin >= min && suggestedMax <= max;
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

    const priceRangeMatch = prompt.match(/Budget:\s*\$?(\d+-\d+)/i);
    const originalPriceRange = priceRangeMatch ? priceRangeMatch[1] : null;
    console.log('Extracted price range:', originalPriceRange);

    // Optimize the system prompt to be more concise
    const systemPrompt = `Generate 8 gift suggestions based on: "${prompt}". Format: [{title, description (2 sentences max), priceRange (X-Y format), reason (1 sentence)}]. Return JSON array only.${
      originalPriceRange ? ` Keep prices within 20% of $${originalPriceRange}.` : ''
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800, // Reduced from 1000 to optimize response time
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    try {
      const content = data.choices[0].message.content.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();
      
      console.log('Cleaned content:', content);
      const suggestions = JSON.parse(content);

      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }

      // Filter suggestions in parallel
      const validSuggestions = await Promise.all(
        suggestions.map(async (suggestion) => {
          const requiredFields = ['title', 'description', 'priceRange', 'reason'];
          const isValid = requiredFields.every(field => suggestion[field]) &&
            (!originalPriceRange || validatePriceRange(suggestion, originalPriceRange));
          return isValid ? suggestion : null;
        })
      );

      const filteredSuggestions = validSuggestions.filter(Boolean);

      if (filteredSuggestions.length < 4) {
        throw new Error('Not enough valid suggestions generated');
      }

      return new Response(
        JSON.stringify({ suggestions: filteredSuggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
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