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
    console.log('Extracted price range:', { min, max });
    return { min, max };
  }
  
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    // Extract price range from prompt
    const priceRange = extractPriceRange(prompt);
    console.log('Extracted price range:', priceRange);

    // Build the prompt
    let enhancedPrompt = `You are a gift suggestion expert. Analyze the recipient's interests, age, gender, and occasion to suggest specific, thoughtful gifts. 

For each suggestion:
- Be specific (e.g., "Sony WH-1000XM4 Wireless Headphones" instead of just "headphones")
- Consider the recipient's interests and lifestyle
- Include a mix of practical and creative gifts
- Consider the occasion appropriateness`;

    // Add budget requirement if price range exists
    if (priceRange) {
      enhancedPrompt += `\n- Stay within budget range: $${priceRange.min}${priceRange.max !== priceRange.min ? `-$${priceRange.max}` : ''}`;
    }

    enhancedPrompt += `\n\nBased on this request: "${prompt}"\n\nReturn ONLY a JSON array of 8 specific gift keywords. Format: ["suggestion1", "suggestion2", ..., "suggestion8"]\nEach suggestion should be searchable on Amazon.\n\nIMPORTANT: Your response must be a valid JSON array containing exactly 8 strings. No other text.`;

    console.log('Enhanced prompt:', enhancedPrompt);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a gift suggestion expert. You MUST always return EXACTLY 8 suggestions."
          },
          { role: "user", content: enhancedPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    let suggestions;
    try {
      const content = data.choices[0].message.content.trim();
      suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions) || suggestions.length !== 8) {
        throw new Error('Invalid response format: expected array of 8 suggestions');
      }
      
      if (!suggestions.every(item => typeof item === 'string')) {
        throw new Error('Invalid response format: all items must be strings');
      }
    } catch (error) {
      console.error('Failed to parse suggestions:', error);
      throw new Error('Failed to parse gift suggestions from DeepSeek response');
    }

    return new Response(
      JSON.stringify({ suggestions }),
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