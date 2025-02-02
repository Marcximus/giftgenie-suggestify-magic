import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

// Extract price range from the prompt with dynamic margins
const extractPriceRange = (prompt: string) => {
  const budgetMatch = prompt.match(/budget(?:\s*of)?\s*\$?(\d+)(?:\s*-\s*\$?(\d+))?/i) ||
                     prompt.match(/\$(\d+)(?:\s*-\s*\$?(\d+))?/);
  
  console.log('Raw budget match:', budgetMatch);
  
  if (!budgetMatch) {
    console.log('No budget specified, using default range');
    return {
      min: 1,
      max: 1000
    };
  }
  
  if (budgetMatch) {
    const min = parseInt(budgetMatch[1]);
    const max = budgetMatch[2] ? parseInt(budgetMatch[2]) : min;
    
    console.log('Extracted values:', { min, max });
    
    // Apply margins based on the price points
    if (max === min) { // Single number budget
      if (min > 100) {
        // 20% margin for budgets above 100
        const margin = min * 0.2;
        const marginMin = Math.floor(min - margin);
        const marginMax = Math.ceil(min + margin);
        console.log('Single budget > 100, applying 20% margin:', {
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
      // For explicit ranges, apply 20% margin to both ends
      const minMargin = min * 0.2;
      const maxMargin = max * 0.2;
      const marginMin = Math.floor(min - minMargin);
      const marginMax = Math.ceil(max + maxMargin);
      console.log('Explicit range, applying 20% margin to both ends:', {
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
  
  // Fallback to default range
  console.log('Using fallback default range');
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

    // Enhanced system message with more specific instructions
    const systemMessage = `You are a talented gift suggestion expert. Your task is to generate EXACTLY 8 specific, searchable gift suggestions.
Key requirements:
- Return suggestions as a JSON array of strings
- Each suggestion must be specific and include brand names when relevant
- Focus on currently available, popular products
- Consider the recipient's interests, age, and occasion
- Stay within the specified budget range`;

    // Enhanced user message with better structure
    const userMessage = `Generate 8 gift suggestions based on this request: "${prompt}"

Guidelines:
1. Make each suggestion specific and searchable (e.g., "Sony WH-1000XM4 Wireless Noise-Canceling Headphones" not just "headphones")
2. Include brand names and model numbers when applicable
3. Consider the price range of $${priceRange.min}-$${priceRange.max}
4. Format response as JSON array: ["suggestion1", "suggestion2", ..., "suggestion8"]

No additional text or explanation needed - just the JSON array.`;

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
        priceRange // Include the extracted and adjusted price range in the response
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