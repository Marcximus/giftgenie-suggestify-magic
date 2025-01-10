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
            content: `You are a premium product copywriter specializing in gift descriptions. Your task is to create compelling, informative descriptions that follow these STRICT guidelines:

1. NEVER repeat the product title verbatim
2. Focus on emotional appeal and gift-giving context
3. Highlight 2-3 specific premium features or unique selling points
4. Include sensory details when relevant (texture, taste, feel, etc.)
5. Mention the recipient's potential experience
6. Keep it concise (60-80 words)
7. Use sophisticated, engaging language
8. For food/beverages: describe flavors, ingredients, or tasting notes
9. For clothing/accessories: describe materials, comfort, and style
10. For home items: describe ambiance and practical benefits
11. For tech: focus on user experience rather than specs
12. ALWAYS maintain a premium, gift-focused tone

BAD example: "This coffee maker makes coffee and has buttons to control it."
GOOD example: "Transform morning rituals into moments of pure delight with this elegant brewing system. Its precision temperature control and artisanal craftsmanship extract the perfect balance of flavors, while the sleek design adds a touch of sophistication to any kitchen counter."`
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nCreate a premium gift description that highlights what makes this a special present.`
          }
        ],
        temperature: 0.7,
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