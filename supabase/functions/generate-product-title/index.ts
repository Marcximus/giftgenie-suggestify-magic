import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();
    console.log('Generating title for:', { title, description });

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a product title optimizer. Return only the simplified title, max 2-5 words."
          },
          { 
            role: "user", 
            content: `Simplify this product title to be concise and clear (max 5 words): ${title}`
          }
        ],
        max_tokens: 30,
        temperature: 1.3,
        stream: false
      }),
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const simplifiedTitle = data.choices[0].message.content.trim();
    
    console.log('Title optimization:', {
      original: title,
      simplified: simplifiedTitle,
      reduction: ((title.length - simplifiedTitle.length) / title.length * 100).toFixed(1) + '%'
    });

    return new Response(
      JSON.stringify({ title: simplifiedTitle }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        } 
      }
    );
      
  } catch (error) {
    console.error('Error in generate-product-title:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate product title'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});