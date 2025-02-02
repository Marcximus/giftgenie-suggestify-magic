import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

// Extract price range from the prompt with dynamic margins
const extractPriceRange = (prompt: string) => {
  // Enhanced regex patterns to match more budget formats
  const budgetPatterns = [
    // Match "Budget: X" or "Budget: X-Y"
    /budget:\s*\$?(\d+)(?:\s*-\s*\$?(\d+))?/i,
    // Match "Budget is X" or "Budget is X-Y"
    /budget\s+is\s*\$?(\d+)(?:\s*-\s*\$?(\d+))?/i,
    // Match "budget of X" or "budget of X-Y"
    /budget(?:\s+of)?\s*\$?(\d+)(?:\s*-\s*\$?(\d+))?/i,
    // Match "price range: X-Y" or "price range X-Y"
    /price\s*range:?\s*\$?(\d+)\s*-\s*\$?(\d+)/i,
    // Match "between X and Y"
    /between\s*\$?(\d+)\s*and\s*\$?(\d+)/i,
    // Match plain "$X-$Y" format
    /\$(\d+)(?:\s*-\s*\$?(\d+))?/,
    // Match "X-Y dollars"
    /(\d+)(?:\s*-\s*(\d+))?\s*dollars?/i,
    // Match "around X" or "about X"
    /(?:around|about|approximately|~)\s*\$?(\d+)/i,
  ];
  
  console.log('Attempting to extract budget from prompt:', prompt);
  
  for (const pattern of budgetPatterns) {
    const match = prompt.match(pattern);
    console.log('Trying pattern:', pattern, 'Match result:', match);
    
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      
      console.log('Found budget match:', { min, max, pattern: pattern.toString() });
      
      // Apply margins based on the price points
      if (max === min) { // Single number budget
        if (min > 100) {
          // 10% margin for budgets above 100
          const margin = min * 0.1;
          const marginMin = Math.floor(min - margin);
          const marginMax = Math.ceil(min + margin);
          console.log('Single budget > 100, applying 10% margin:', {
            originalValue: min,
            margin,
            marginMin,
            marginMax
          });
          return {
            min: marginMin,
            max: marginMax
          };
        } else {
          // 15 dollar margin for budgets below/equal to 100
          const marginMin = Math.max(1, Math.floor(min - 15));
          const marginMax = Math.ceil(min + 15);
          console.log('Single budget <= 100, applying $15 margin:', {
            originalValue: min,
            marginMin,
            marginMax
          });
          return {
            min: marginMin,
            max: marginMax
          };
        }
      } else {
        // For explicit ranges, apply 10% margin to both ends
        const minMargin = min * 0.1;
        const maxMargin = max * 0.1;
        const marginMin = Math.floor(min - minMargin);
        const marginMax = Math.ceil(max + maxMargin);
        console.log('Explicit range, applying 10% margin to both ends:', {
          originalMin: min,
          originalMax: max,
          minMargin,
          maxMargin,
          marginMin,
          marginMax
        });
        return { 
          min: marginMin,
          max: marginMax 
        };
      }
    }
  }
  
  // Log when no budget is found
  console.log('No budget pattern matched in prompt, using default range');
  return {
    min: 1,
    max: 1000
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting gift suggestion generation...');

    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not configured');
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      console.error('Invalid prompt received:', prompt);
      throw new Error('Invalid prompt');
    }

    // Extract and adjust price range from prompt
    const priceRange = extractPriceRange(prompt);
    console.log('Price range with margins:', priceRange);

    // Updated system message with new format
    const systemMessage = `You are a talented gift suggestion expert. Your task is to generate EXACTLY 8 gift suggestions.
Key requirements:
- Return suggestions as a JSON array of strings
- Consider the recipient's gender, interests, age, and occasion
- Stay within the specified budget range`;

    // Updated user message with new format
    const userMessage = `Generate 8 gift suggestions based on this request: "${prompt}"
- Consider the recipient's gender, interests, age, and occasion
- Do not use unnecessary adjectives
- Format response as JSON array: ["suggestion1", "suggestion2", ..., "suggestion8"]
- No additional text, explanation or formatting needed - just the JSON array.`;

    console.log('Sending request to DeepSeek API with messages:', {
      systemMessage,
      userMessage
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from DeepSeek API:', data);
      throw new Error('Invalid response format from DeepSeek API');
    }

    let suggestions;
    try {
      const content = data.choices[0].message.content.trim();
      suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions)) {
        console.error('Invalid response format: not an array:', suggestions);
        throw new Error('Invalid response format: expected array of suggestions');
      }

      if (suggestions.length !== 8) {
        console.error(`Invalid number of suggestions: ${suggestions.length}`);
        throw new Error('Invalid response format: expected exactly 8 suggestions');
      }

      if (!suggestions.every(item => typeof item === 'string')) {
        console.error('Invalid suggestion format:', suggestions);
        throw new Error('Invalid response format: all items must be strings');
      }
    } catch (error) {
      console.error('Failed to parse suggestions:', error);
      throw new Error('Failed to parse gift suggestions from DeepSeek response');
    }

    console.log('Successfully generated suggestions:', suggestions);

    return new Response(
      JSON.stringify({ 
        suggestions,
        priceRange
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});