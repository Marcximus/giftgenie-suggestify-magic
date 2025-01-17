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

    const prompt = buildBlogPrompt(title);
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    // Step 1: Generate initial content
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
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await response.json();
    console.log('OpenAI response received, processing content...');

    const initialContent = openaiData.choices[0].message.content;
    console.log('Generated content length:', initialContent.length);
    console.log('Generated content preview:', initialContent.substring(0, 500));

    // Step 2: Process content to add Amazon products
    console.log('Processing content to add Amazon products...');
    const processResponse = await fetch('https://ckcqttsdpxfbpkzljctl.supabase.co/functions/v1/process-blog-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ content: initialContent }),
    });

    if (!processResponse.ok) {
      const error = await processResponse.text();
      console.error('Error processing content:', error);
      throw new Error(`Failed to process content: ${error}`);
    }

    const processedData = await processResponse.json();
    console.log('Content processed successfully:', {
      contentLength: processedData.content.length,
      affiliateLinksCount: processedData.affiliateLinks?.length || 0,
      searchFailuresCount: processedData.searchFailures?.length || 0
    });

    return new Response(
      JSON.stringify(processedData),
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