import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processContent } from "../_shared/content-processor.ts";
import { buildBlogPrompt } from "./openaiPrompt.ts";

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
    console.log('Generating blog post for title:', title);

    // Verify required API keys
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const openAiKey = Deno.env.get('OPENAI_API_KEY');

    if (!associateId || !rapidApiKey || !openAiKey) {
      console.error('Missing required API keys:', {
        hasAssociateId: !!associateId,
        hasRapidApiKey: !!rapidApiKey,
        hasOpenAiKey: !!openAiKey
      });
      throw new Error('Missing required API configuration');
    }

    const numItemsMatch = title.match(/\b(\d+)\b/);
    const numItems = numItemsMatch ? parseInt(numItemsMatch[1]) : 5;
    console.log('Number of items to generate:', numItems);

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
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    console.log('Generated raw content length:', rawContent.length);

    // Process content with Amazon product data
    console.log('Processing content with Amazon data...');
    const { content, affiliateLinks } = await processContent(rawContent, associateId, rapidApiKey);
    
    console.log('Content processed successfully:', {
      originalLength: rawContent.length,
      processedLength: content.length,
      numAffiliateLinks: affiliateLinks.length,
      affiliateLinks: affiliateLinks.map(link => ({
        title: link.productTitle,
        hasImage: !!link.imageUrl
      }))
    });

    return new Response(
      JSON.stringify({ content, affiliateLinks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});