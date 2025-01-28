import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Generating title:', { originalTitle: title });

    if (!title) {
      throw new Error('Title is required');
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
            content: "You are a product title optimizer. Return only the simplified title, no additional text or formatting."
          },
          { 
            role: "user", 
            content: "Simplify this product title, max 2-5 words. Return ONLY the final title without any formatting or extra text: " + title 
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
        statusText: response.statusText,
        body: await response.text()
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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});