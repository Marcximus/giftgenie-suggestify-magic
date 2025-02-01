import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a concise product description writer. Your task is to:

1. Create descriptions that are EXACTLY 13-18 words long
2. NEVER repeat any words from the product title
3. Focus on unique benefits and features
4. Use clear, straightforward language
5. Avoid marketing language or superlatives
6. Do not mention price or discounts
7. Do not use phrases like "perfect for" or "great gift"

Return ONLY the description, no additional text or formatting.`
          },
          {
            role: "user",
            content: `Create a concise description for this product: ${title}\n\nOriginal description: ${description}`
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedDescription = data.choices[0].message.content.trim();

    // Validate word count
    const wordCount = generatedDescription.split(/\s+/).length;
    if (wordCount < 13 || wordCount > 18) {
      console.warn('Description length outside target range:', {
        description: generatedDescription,
        wordCount
      });
    }

    // Check for title word repetition
    const titleWords = new Set(title.toLowerCase().split(/\s+/));
    const descriptionWords = generatedDescription.toLowerCase().split(/\s+/);
    const repeatedWords = descriptionWords.filter(word => titleWords.has(word));
    
    if (repeatedWords.length > 0) {
      console.warn('Description contains words from title:', {
        repeatedWords,
        description: generatedDescription
      });
    }

    return new Response(
      JSON.stringify({ description: generatedDescription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-custom-description:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});