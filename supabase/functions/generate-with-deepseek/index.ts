import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildBlogPrompt } from '../generate-blog-post/promptBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const INITIAL_TIMEOUT = 60000; // 1 minute initial timeout

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

    let lastError = null;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      const timeout = INITIAL_TIMEOUT * Math.pow(2, attempt); // Exponential timeout increase
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        console.log(`Attempt ${attempt + 1} with timeout ${timeout}ms`);
        
        const response = await fetch('https://api.deepseek.com/chat/completions', {
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
            max_tokens: 7999,
            temperature: 1.3,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
            stream: false
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.text();
          console.error('DeepSeek API error:', error);
          throw new Error(`DeepSeek API error: ${error}`);
        }

        const data = await response.json();
        console.log('Raw DeepSeek response received');
        
        if (data.choices?.[0]?.message?.reasoning_content) {
          console.log('Chain of Thought reasoning:', data.choices[0].message.reasoning_content);
        }

        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid response structure from DeepSeek API');
        }

        const initialContent = data.choices[0].message.content;
        console.log('Generated content length:', initialContent.length);
        console.log('First 500 characters of content:', initialContent.substring(0, 500));

        // Verify product sections
        const productCount = (initialContent.match(/<h3>/g) || []).length;
        console.log('Number of product sections:', productCount);
        if (productCount !== 10) {
          console.warn(`Warning: Generated ${productCount} products instead of requested 10`);
        }

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
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        // If it's not a timeout or network error, don't retry
        if (!error.name?.includes('AbortError') && !error.message?.includes('Failed to fetch')) {
          throw error;
        }
        
        attempt++;
        if (attempt < MAX_RETRIES) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying in ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');

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