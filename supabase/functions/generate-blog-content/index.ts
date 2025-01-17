import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry logic with exponential backoff
async function retryWithBackoff(operation: () => Promise<any>, maxAttempts = 3): Promise<any> {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = error;
      if (error.status === 429) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Rate limited. Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, title } = await req.json();
    console.log(`Generating ${type} for title: "${title}"`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'excerpt':
        systemPrompt = 'You are a skilled content writer who creates engaging blog post excerpts. Create a brief, compelling excerpt (max 150 characters) that captures the essence of the blog post and encourages readers to click through.';
        userPrompt = `Title: ${title}\nContent: ${content}\n\nCreate a brief, engaging excerpt for this blog post.`;
        break;
      case 'seo-title':
        systemPrompt = 'You are an SEO expert who creates optimized meta titles. Create a compelling meta title (50-60 characters) that is both search engine friendly and engaging for readers.';
        userPrompt = `Blog Title: ${title}\nContent: ${content}\n\nCreate an SEO-optimized meta title.`;
        break;
      case 'seo-description':
        systemPrompt = 'You are an SEO expert who creates optimized meta descriptions. Create a compelling meta description (150-160 characters) that accurately summarizes the content and includes relevant keywords.';
        userPrompt = `Title: ${title}\nContent: ${content}\n\nCreate an SEO-optimized meta description.`;
        break;
      case 'seo-keywords':
        systemPrompt = 'You are an SEO expert who identifies relevant keywords. Extract or suggest 5-8 relevant keywords or key phrases from the content, separated by commas.';
        userPrompt = `Title: ${title}\nContent: ${content}\n\nExtract relevant keywords and key phrases.`;
        break;
      case 'improve-content':
        systemPrompt = 'You are a professional content editor who improves blog post content while maintaining the original message and style. Enhance the content by improving clarity, engagement, and readability.';
        userPrompt = `Title: ${title}\nContent: ${content}\n\nImprove this content while maintaining its core message.`;
        break;
      default:
        throw new Error('Invalid content type specified');
    }

    const generateContent = async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: type === 'improve-content' ? 2000 : 200,
        }),
      });

      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status}`);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    };

    const generatedContent = await retryWithBackoff(generateContent);
    console.log(`Successfully generated ${type} content`);

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        details: error.stack,
        type: 'generate-blog-content-error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});