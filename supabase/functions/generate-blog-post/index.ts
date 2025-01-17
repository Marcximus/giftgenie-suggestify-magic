import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildBlogPrompt } from "./promptBuilder.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post for title:', title);

    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }

    // Verify required secrets are available
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');

    if (!openaiKey || !rapidApiKey || !associateId) {
      console.error('Missing required environment variables:', {
        hasOpenAI: !!openaiKey,
        hasRapidApi: !!rapidApiKey,
        hasAssociateId: !!associateId
      });
      throw new Error('Missing required API keys');
    }

    const prompt = buildBlogPrompt(title);
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    // Step 1: Generate initial content with improved error handling
    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using the latest recommended model
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
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await response.json();
    console.log('OpenAI response received, processing content...');

    if (!openaiData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', openaiData);
      throw new Error('Invalid response format from OpenAI');
    }

    const initialContent = openaiData.choices[0].message.content;
    console.log('Generated content length:', initialContent.length);
    console.log('Generated content preview:', initialContent.substring(0, 500));

    // Step 2: Process content to add Amazon products with improved error handling
    console.log('Processing content to add Amazon products...');
    const processResponse = await fetch('https://ckcqttsdpxfbpkzljctl.supabase.co/functions/v1/process-blog-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        ...corsHeaders,
      },
      body: JSON.stringify({ 
        content: initialContent,
        associateId: associateId 
      }),
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      console.error('Error processing content:', errorText);
      throw new Error(`Failed to process content: ${errorText}`);
    }

    const processedData = await processResponse.json();
    console.log('Content processed successfully:', {
      contentLength: processedData.content.length,
      affiliateLinksCount: processedData.affiliateLinks?.length || 0,
      searchFailuresCount: processedData.searchFailures?.length || 0
    });

    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
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
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});