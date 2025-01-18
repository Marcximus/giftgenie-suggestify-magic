import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Generating suggestions with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Explicitly using non-DALL-E model
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion expert. Analyze the recipient's interests, age, gender, and occasion to suggest specific, thoughtful gifts. 
              For each suggestion:
              - Be specific (e.g., "Sony WH-1000XM4 Wireless Headphones" instead of just "headphones")
              - Consider the recipient's interests and lifestyle
              - Include a mix of practical and creative gifts
              - Consider the occasion appropriateness
              - Stay within any specified budget
              - Ensure gender appropriateness
              
              Return ONLY a JSON array of 8 specific gift keywords in this format: ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5", "suggestion6", "suggestion7", "suggestion8"]
              Each suggestion should be searchable on Amazon.
              
              IMPORTANT: Your response must be a valid JSON array containing exactly 8 strings. Do not include any additional text or formatting.`
          },
          { 
            role: "user", 
            content: `${prompt}\n\nIMPORTANT: Respond with ONLY a JSON array of strings. No other text.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    try {
      const suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions) || suggestions.length !== 8) {
        throw new Error('Invalid response format: expected array of 8 suggestions');
      }
      
      if (!suggestions.every(item => typeof item === 'string')) {
        throw new Error('Invalid response format: all items must be strings');
      }
      
      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      throw new Error('Failed to parse gift suggestions from OpenAI response');
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});