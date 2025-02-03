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
    let systemMessage = '';
    
    switch (type) {
      case 'excerpt':
        systemMessage = `You are an SEO expert crafting blog post excerpts. Important guidelines:
- Never include specific years or dates
- Focus on evergreen content
- Keep it between 150-200 words
- Make it engaging and SEO-friendly`;
        prompt = `Write a compelling excerpt for a blog post titled "${title}" with this content: ${content.substring(0, 500)}...`;
        break;
      case 'seo-title':
        systemMessage = `You are an SEO expert crafting meta titles. Important guidelines:
- Never include specific years or dates
- Keep it between 50-60 characters
- Make it engaging and include relevant keywords`;
        prompt = `Generate an SEO-optimized meta title for a blog post titled "${title}".`;
        break;
      case 'seo-description':
        systemMessage = `You are an SEO expert crafting meta descriptions. Important guidelines:
- Never include specific years or dates
- Keep it between 150-160 characters
- Include key benefits and a call to action
- Make it compelling for search results`;
        prompt = `Write an SEO-optimized meta description for a blog post titled "${title}".`;
        break;
      case 'seo-keywords':
        systemMessage = `You are an SEO expert selecting keywords. Important guidelines:
- Never include specific years or dates
- Generate 5-8 relevant keywords
- Focus on evergreen, timeless terms
- Format as a comma-separated list`;
        prompt = `Generate relevant SEO keywords for a blog post titled "${title}".`;
        break;
      case 'improve-content':
        systemMessage = `You are a content improvement expert. Important guidelines:
- Never include specific years or dates
- Maintain HTML formatting
- Make content more engaging and SEO-friendly
- Keep the same structure`;
        prompt = `Improve this blog post content while maintaining its structure and HTML formatting: ${content}`;
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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemMessage
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
    let generatedContent = data.choices[0].message.content.trim();

    // Additional validation to remove any years that might have slipped through
    const currentYear = new Date().getFullYear();
    const yearRegex = new RegExp(`\\b(19|20)\\d{2}\\b`, 'g');
    
    // Check for years in the last century and this century
    generatedContent = generatedContent.replace(yearRegex, '');
    
    // Remove any double spaces that might have been created
    generatedContent = generatedContent.replace(/\s+/g, ' ').trim();

    console.log(`Generated ${type} content:`, generatedContent);

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