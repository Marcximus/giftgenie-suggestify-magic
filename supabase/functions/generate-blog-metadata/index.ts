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
    const { type, title, content } = await req.json();
    
    let prompt = '';
    switch (type) {
      case 'excerpt':
        prompt = `Create a compelling blog post excerpt (max 150 characters) for an article titled "${title}". The excerpt should be engaging and make readers want to read more.`;
        break;
      case 'seo-title':
        prompt = `Create an SEO-optimized title (max 60 characters) for a blog post about "${title}". Focus on keywords and readability.`;
        break;
      case 'seo-description':
        prompt = `Write an SEO meta description (max 160 characters) for a blog post titled "${title}". Make it compelling and include relevant keywords.`;
        break;
      case 'seo-keywords':
        prompt = `Generate relevant SEO keywords (comma-separated) for a blog post titled "${title}". Include both broad and specific terms.`;
        break;
      default:
        throw new Error('Invalid generation type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert specializing in creating engaging blog metadata.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-blog-metadata function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});