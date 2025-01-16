import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { processContent } from "../_shared/content-processor.ts";
import { buildBlogPrompt } from "./promptBuilder.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    const { title } = await req.json();
    console.log('Generating blog post for:', { title });

    // Verify required API keys
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const openAiKey = Deno.env.get('OPENAI_API_KEY');

    if (!associateId || !rapidApiKey || !openAiKey) {
      console.error('Missing required API keys');
      throw new Error('Missing required API configuration');
    }

    let numItems = 5;
    const titleNumMatch = title.match(/\b(\d+)\b/);
    if (titleNumMatch) {
      const parsedNum = parseInt(titleNumMatch[1]);
      if (parsedNum > 0 && parsedNum <= 10) {
        numItems = parsedNum;
      }
    }
    console.log('Number of items to generate:', numItems);

    console.log('Making OpenAI request...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          buildBlogPrompt(numItems),
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      const errorText = await response.text();
      console.error('OpenAI error details:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let rawContent = data.choices[0].message.content;
    
    // Process the content to ensure proper paragraph spacing
    rawContent = rawContent
      // Ensure emoji indicators start new paragraphs
      .replace(/([^\n])🎁/g, '$1\n\n🎁')
      .replace(/([^\n])⭐/g, '$1\n\n⭐')
      .replace(/([^\n])💝/g, '$1\n\n💝')
      // Ensure proper spacing after paragraphs
      .replace(/([.!?])\s+([^🎁⭐💝\n])/g, '$1\n\n$2')
      // Clean up any excessive newlines
      .replace(/\n{3,}/g, '\n\n');

    console.log('Generated raw content length:', rawContent.length);

    // Process content with Amazon product data
    console.log('Processing content with Amazon data...');
    const { content, affiliateLinks } = await processContent(rawContent, associateId, rapidApiKey);
    
    console.log('Content processed successfully:', {
      originalLength: rawContent.length,
      processedLength: content.length,
      numAffiliateLinks: affiliateLinks.length
    });

    return new Response(
      JSON.stringify({ content, affiliateLinks }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-blog-post function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        details: error.stack,
        type: 'generate-blog-post-error'
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