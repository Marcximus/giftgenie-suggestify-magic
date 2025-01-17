import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff(operation: () => Promise<any>, maxAttempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = error;
      if (error.status === 429) {
        const delayMs = Math.min(2000 * Math.pow(2, attempt - 1), 20000);
        console.log(`Rate limited. Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

async function generateContent(type: string, content: string, title: string) {
  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiKey) {
    throw new Error('OpenAI API key not configured');
  }

  let prompt = '';
  switch (type) {
    case 'excerpt':
      prompt = `Write a compelling excerpt (150-200 words) for a blog post titled "${title}" that summarizes the main points and entices readers to click through. The excerpt should be SEO-friendly and include relevant keywords.`;
      break;
    case 'seo-title':
      prompt = `Generate an SEO-optimized meta title (50-60 characters) for a blog post titled "${title}". Include relevant keywords while maintaining readability.`;
      break;
    case 'seo-description':
      prompt = `Write an engaging meta description (150-160 characters) for a blog post titled "${title}". Include key benefits and a call-to-action while optimizing for SEO.`;
      break;
    case 'seo-keywords':
      prompt = `Generate a comma-separated list of 8-10 relevant SEO keywords for a blog post titled "${title}". Include both short and long-tail keywords.`;
      break;
    case 'improve-content':
      prompt = `Improve the following blog post content while maintaining its structure and key points. Make it more engaging, clear, and SEO-friendly:\n\n${content}`;
      break;
    default:
      throw new Error('Invalid content type requested');
  }

  console.log('Making OpenAI request for:', type);
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
          content: "You are an expert blog writer and SEO specialist. Provide concise, engaging, and optimized content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    console.error('OpenAI API error:', response.status, await response.text());
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, title } = await req.json();
    console.log('Received request:', { type, title });

    if (!type || !title) {
      throw new Error('Missing required parameters');
    }

    const generatedContent = await retryWithBackoff(async () => {
      return await generateContent(type, content || '', title);
    });

    console.log('Successfully generated content');
    return new Response(
      JSON.stringify({ content: generatedContent }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
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
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  }
});