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
            content: `You are a creative product description writer. Your task is to create engaging, informative descriptions that:

1. VARY YOUR OPENINGS:
- Use diverse ways to start descriptions
- Avoid repetitive phrases like "Imagine" or "Picture this"
- Focus on the product's key features and benefits

2. BE CONCISE BUT INFORMATIVE:
- Keep descriptions under 2 sentences
- Highlight the most important features
- Explain why this makes a great gift

3. MAINTAIN PROFESSIONALISM:
- Use clear, straightforward language
- Avoid overly casual or marketing-style language
- Focus on factual information

4. STRUCTURE:
First sentence: Describe the main feature or benefit
Second sentence: Explain why it makes a great gift

Example formats:
- "This [product] delivers [key benefit], making it a perfect gift for [recipient type]."
- "Featuring [key feature], this [product] is ideal for [specific use case]."
- "Crafted with [quality/feature], this [product] offers [benefit] that any [recipient] would appreciate."

Return only the description, no additional formatting or text.`
          },
          {
            role: "user",
            content: `Create a concise, engaging description for this product: ${title}\n\nOriginal description: ${description}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ description: data.choices[0].message.content.trim() }),
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