import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processContent } from "../_shared/content-processor.ts";
import { buildBlogPrompt } from "./promptBuilder.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    const numItems = 3; // Number of product suggestions to include

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const amazonAssociateId = Deno.env.get('AMAZON_ASSOCIATE_ID');

    if (!openaiApiKey || !rapidApiKey || !amazonAssociateId) {
      throw new Error('Required environment variables are not set');
    }

    // Generate initial blog post content using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          buildBlogPrompt(numItems),
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const initialContent = openaiData.choices[0].message.content;

    // Process the content to add Amazon product information
    const { content, affiliateLinks } = await processContent(
      initialContent,
      amazonAssociateId,
      rapidApiKey
    );

    return new Response(
      JSON.stringify({ content, affiliateLinks }),
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