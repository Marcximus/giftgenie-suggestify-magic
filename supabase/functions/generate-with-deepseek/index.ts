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

    // Make the API request with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      console.log('Making request to DeepSeek API...');
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
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
          max_tokens: 4000,
          temperature: 1.3,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      // Get the raw response text first
      const responseText = await response.text();
      console.log('Raw DeepSeek API response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse DeepSeek response as JSON:', error);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Invalid JSON response from DeepSeek API');
      }

      // Validate the response structure
      if (!data || !data.choices || !data.choices[0]?.message?.content) {
        console.error('Unexpected DeepSeek response structure:', JSON.stringify(data, null, 2));
        throw new Error('Invalid response structure from DeepSeek API');
      }

      console.log('Successfully parsed DeepSeek response');
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
      if (error.name === 'AbortError') {
        throw new Error('DeepSeek API request timed out after 60 seconds');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    console.error('Error in generate-with-deepseek:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
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