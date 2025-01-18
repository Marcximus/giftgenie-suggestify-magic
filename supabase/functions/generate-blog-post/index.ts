import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { buildBlogPrompt } from './promptBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Generating blog post for title:', title);

    // Extract number of products from title
    const numMatch = title.match(/top\s+(\d+)|best\s+(\d+)/i);
    const numProducts = numMatch ? parseInt(numMatch[1] || numMatch[2]) : 10;
    console.log('Number of products to generate:', numProducts);

    const prompt = buildBlogPrompt(numProducts);
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          prompt,
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}\n${errorText}`);
    }

    const openaiData = await response.json();
    console.log('OpenAI response received, processing content...');

    const content = openaiData.choices[0].message.content;
    console.log('Generated content length:', content.length);
    console.log('Content contains <h3> tags:', content.includes('<h3>'));
    console.log('Content contains <hr> tags:', content.includes('<hr'));
    console.log('Number of product sections:', (content.match(/<h3>/g) || []).length);

    // Return the generated content
    return new Response(
      JSON.stringify({ 
        content,
        affiliateLinks: [] // Will be populated by the process-blog-content function
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'generate-blog-post-error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});