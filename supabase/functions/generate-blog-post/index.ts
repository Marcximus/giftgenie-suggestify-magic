import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { buildBlogPrompt } from './promptBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post for title:', title);

    // Extract number of products from title
    const numMatch = title.match(/top\s+(\d+)/i);
    const numProducts = numMatch ? parseInt(numMatch[1]) : 8;
    console.log('Number of products to generate:', numProducts);

    // Detect demographic information
    const titleLower = title.toLowerCase();
    const isTeenage = titleLower.includes('teen') || titleLower.includes('teenage');
    const isFemale = titleLower.includes('sister') || titleLower.includes('girl') || titleLower.includes('daughter');
    
    // Build demographic-specific prompt
    const demographicContext = isTeenage && isFemale ? `
      CRITICAL: These suggestions are specifically for a teenage girl. Consider:
      - Current teen trends and interests (TikTok, Instagram, etc.)
      - Age-appropriate items (13-19 years)
      - Popular brands among teenage girls
      - Social media and technology preferences
      - Creative expression and personal style
      - School and study needs
      - Social activities and hobbies
      - Beauty and fashion interests
      - Music and entertainment preferences
      - Room decoration and personalization
    ` : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          buildBlogPrompt(numProducts),
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}\n\n${demographicContext}`
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

    // Process the content to add Amazon product information
    const { data: processedContent, error: processingError } = await supabase.functions.invoke('process-blog-content', {
      body: { content: initialContent }
    });

    if (processingError) {
      console.error('Content processing error:', processingError);
      throw processingError;
    }

    return new Response(
      JSON.stringify({ content: processedContent }),
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