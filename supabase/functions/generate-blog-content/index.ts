import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, title } = await req.json();
    console.log('Generating content for type:', type);

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    switch (type) {
      case 'excerpt':
        prompt = `Write a compelling, SEO-friendly excerpt (150-200 words) for a blog post titled "${title}" with this content: ${content.substring(0, 500)}...`;
        break;
      case 'seo-title':
        prompt = `Generate an SEO-optimized meta title (50-60 characters) for a blog post titled "${title}". Make it engaging and include relevant keywords.`;
        break;
      case 'seo-description':
        prompt = `Write an SEO-optimized meta description (150-160 characters) for a blog post titled "${title}". Include key benefits and a call to action.`;
        break;
      case 'seo-keywords':
        prompt = `Generate 5-8 relevant SEO keywords for a blog post titled "${title}". Format as a comma-separated list.`;
        break;
      case 'improve-content':
        prompt = `Improve this blog post content while maintaining its structure and HTML formatting. Focus on making it more engaging, clearer, and SEO-friendly: ${content}`;
        break;
      default:
        throw new Error('Invalid content type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",  // Updated to use gpt-4o
        messages: [
          {
            role: "system",
            content: "You are an expert blog writer and SEO specialist. Generate content that is engaging, optimized for search engines, and maintains proper formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: type === 'improve-content' ? 3500 : 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});