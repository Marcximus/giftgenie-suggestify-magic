import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildBlogPrompt } from "./promptBuilder.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post for title:', title);

    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = buildBlogPrompt(title);
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          prompt,
          {
            role: "user",
            content: `Generate a detailed blog post about: ${title}. 
                     Follow EXACTLY the format specified in the system message.
                     Do not deviate from the required structure.
                     Include all HTML tags and formatting exactly as specified.
                     Make sure to include all required sections and elements.`
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
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, processing content...');

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content length:', generatedContent.length);
    console.log('Generated content preview:', generatedContent.substring(0, 500));

    // Validate content structure
    if (!generatedContent.includes('<h3>') || 
        !generatedContent.includes('<hr class="my-8">') ||
        !generatedContent.includes('<ul class="my-4">') ||
        !generatedContent.includes('<li>✅')) {
      console.error('Generated content missing required HTML structure');
      throw new Error('Generated content does not match required format');
    }

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'generate-blog-post-error',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});