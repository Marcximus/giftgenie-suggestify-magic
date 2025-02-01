import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

// Extract price range from the prompt
const extractPriceRange = (prompt: string) => {
  const budgetMatch = prompt.match(/budget(?:\s*of)?\s*\$?(\d+)(?:\s*-\s*\$?(\d+))?/i) ||
                     prompt.match(/\$(\d+)(?:\s*-\s*\$?(\d+))?/);
  
  if (budgetMatch) {
    const min = parseInt(budgetMatch[1]);
    const max = budgetMatch[2] ? parseInt(budgetMatch[2]) : min;
    
    // Apply 20% margin to the price range
    const adjustedMin = Math.floor(min * 0.8); // 20% below
    const adjustedMax = Math.ceil(max * 1.2); // 20% above
    
    console.log('Extracted price range:', { 
      original: { min, max },
      adjusted: { min: adjustedMin, max: adjustedMax }
    });
    
    return { min: adjustedMin, max: adjustedMax };
  }
  
  return null;
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
    console.log('Price range with 20% margin:', priceRange);

    // Build the system message
    const systemMessage = "You are a talented gift suggestion expert. You MUST always return EXACTLY 8 suggestions in a valid JSON array format.";

    // Build the user message with enhanced prompt structure
    const userMessage = `Based on this request suggest gifts: "${prompt}"

Requirements:
1. Return EXACTLY 8 specific gift suggestions
2. Consider gender, age, budget and occasion
3. Suggestions should be easy to understand and searchable (e.g., "Apple Airpods 2" not just "Earpods")
4. Format your response as a JSON array of 8 strings: ["suggestion1", "suggestion2", ..., "suggestion8"]
No other text allowed.`;

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