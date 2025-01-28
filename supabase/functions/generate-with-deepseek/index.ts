import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildBlogPrompt } from '../generate-blog-post/promptBuilder.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post with DeepSeek Reasoner for title:', title);

    if (!title) {
      throw new Error('Title is required');
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Get the prompt from promptBuilder
    const prompt = buildBlogPrompt();
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-reasoner",
        messages: [
          prompt,
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}\n\nIMPORTANT: You MUST generate EXACTLY 10 product recommendations, no more, no less.`
          }
        ],
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', JSON.stringify(data, null, 2));
    
    // Log both the reasoning content and final content
    if (data.choices[0].message.reasoning_content) {
      console.log('Chain of Thought reasoning:', data.choices[0].message.reasoning_content);
    }
    console.log('Generated content length:', data.choices[0].message.content.length);
    console.log('First 500 characters of content:', data.choices[0].message.content.substring(0, 500));

    const initialContent = data.choices[0].message.content;

    // Initialize Supabase client for processing the content
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the content to add Amazon product information
    const { data: processedContent, error: processingError } = await supabase.functions.invoke('process-blog-content', {
      body: { content: initialContent }
    });

    if (processingError) {
      console.error('Content processing error:', processingError);
      throw processingError;
    }

    console.log('Content processed successfully');
    console.log('Final content length:', processedContent.content.length);
    console.log('Number of affiliate links:', processedContent.affiliateLinks?.length || 0);

    return new Response(
      JSON.stringify(processedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-with-deepseek:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'deepseek-generation-error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
