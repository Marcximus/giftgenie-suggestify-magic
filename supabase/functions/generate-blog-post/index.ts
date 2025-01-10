import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title } = await req.json()
    console.log('Generating blog post for:', title)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional gift blog writer. Create engaging, well-structured blog posts about gifts and shopping recommendations. Follow these guidelines:
            1. Use HTML formatting for structure (h2, h3, p tags, etc.)
            2. Include emojis where appropriate
            3. Break content into clear sections
            4. Include Amazon affiliate product recommendations where relevant
            5. Use bullet points and numbered lists where appropriate
            6. Keep the tone friendly and informative
            7. Include a conclusion section
            8. Format prices as USD
            9. Include at least 3-5 specific product recommendations
            10. Make sure all HTML is properly formatted and nested`
          },
          {
            role: "user",
            content: `Write a detailed blog post with the title: "${title}". Include specific product recommendations with affiliate links and proper HTML formatting.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate blog post')
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-blog-post function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})