import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, title } = await req.json();
    console.log('Generating content:', { type, contentLength: content?.length, title });

    let systemPrompt = 'You are a creative content writer specializing in blog posts and product descriptions.';
    let userPrompt = '';

    switch (type) {
      case 'excerpt':
        systemPrompt += ' Create a compelling, SEO-friendly excerpt that summarizes the main points.';
        userPrompt = `Write a brief excerpt (max 150 words) for a blog post titled "${title}" with the following content:\n\n${content}`;
        break;
      case 'seo-title':
        systemPrompt += ' Create an SEO-optimized title that maintains the original meaning.';
        userPrompt = `Generate an SEO-friendly meta title (max 60 characters) for: "${title}"`;
        break;
      case 'seo-description':
        systemPrompt += ' Create an engaging meta description that encourages clicks.';
        userPrompt = `Write an SEO meta description (max 155 characters) for a blog post titled "${title}" with content:\n\n${content}`;
        break;
      case 'seo-keywords':
        systemPrompt += ' Generate relevant keywords for SEO optimization.';
        userPrompt = `Generate 5-8 relevant SEO keywords for a blog post titled "${title}" with content:\n\n${content}`;
        break;
      case 'improve-content':
        systemPrompt += ' Enhance the content while maintaining the core message and structure.';
        userPrompt = `Improve this blog post content while keeping the same structure and main points:\n\n${content}`;
        break;
      default:
        throw new Error('Invalid content type specified');
    }

    console.log('Making OpenAI request with:', { type, systemPrompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: type === 'improve-content' ? 2000 : 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}\n${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const generatedContent = data.choices[0].message.content;
    console.log('Generated content length:', generatedContent.length);

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'generate-blog-content-error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});