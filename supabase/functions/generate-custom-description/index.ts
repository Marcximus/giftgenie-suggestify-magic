import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, originalDescription } = await req.json();
    console.log('Generating custom description for:', title);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a creative gift copywriter with a fun, engaging style. Your descriptions should be unique and captivating, avoiding clichéd openings like "elevate" or "embark." Follow these guidelines:

1. Start each description differently - be creative and varied
2. Focus on what makes this gift special and memorable
3. Include sensory details or emotional appeal
4. Keep descriptions concise (60-80 words)
5. Use engaging, conversational language
6. Highlight unique features or experiences
7. Consider the gift-giving context
8. Make each description distinct and fresh

AVOID these overused openings:
- "Elevate..."
- "Embark..."
- "Transform..."
- "Discover..."
- "Experience..."
- "Introducing..."

Instead, use creative, varied approaches like:
- Describing a moment of use
- Starting with an interesting fact
- Using playful or intriguing questions
- Beginning with sensory details
- Opening with emotional appeal
- Using humor when appropriate

BAD example: "Elevate their coffee experience with this premium machine."
GOOD example: "Watch their eyes light up as the rich aroma of barista-quality coffee fills their kitchen. This sleek machine brings cafe-worthy brews home, combining Italian craftsmanship with one-touch convenience for their perfect morning cup."`
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nCreate an engaging, unique gift description that captures what makes this a special present.`
          }
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return new Response(
        JSON.stringify({ description: originalDescription }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.replace(/['"]/g, '') || originalDescription;

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-custom-description function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});