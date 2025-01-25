import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateTitleFromDescription(description: string): Promise<string> {
  const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
  
  try {
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
            content: `You are a product title generator. Create clear, concise product titles (5-7 words max) from product descriptions.
            RULES:
            1. NO marketing terms (Premium, Luxury, Professional, etc.)
            2. Include brand name only if well-known
            3. Focus on essential product type and key feature
            4. Remove unnecessary adjectives
            5. Be specific but brief`
          },
          {
            role: "user",
            content: `Create a clear, concise title for this product description: ${description}`
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
        stream: false
      }),
    });

    if (!response.ok) {
      console.error('Title generation API error:', await response.text());
      throw new Error('Failed to generate title');
    }

    const data = await response.json();
    console.log('Generated title response:', data);
    
    return data.choices[0].message.content.trim()
      .replace(/["']/g, '')
      .replace(/^\w+:\s*/, '');
  } catch (error) {
    console.error('Error generating title:', error);
    return description.split(' ').slice(0, 6).join(' ');
  }
}

serve(async (req) => {
  const startTime = performance.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    // Initial suggestion generation with DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion expert. For each gift idea, provide a detailed description focusing on features, benefits, and why it's appropriate for the recipient. Return a JSON array of exactly 8 detailed product descriptions.

            Example format:
            [
              "A ceramic teapot with built-in infuser, perfect for brewing loose leaf teas. Features a 32oz capacity and keeps tea warm for hours. Includes a matching cup and saucer set with delicate cat designs.",
              "An automatic cat water fountain with 2L capacity, featuring a quiet pump and multiple flow settings. Includes replaceable carbon filters and LED lighting for nighttime visibility."
            ]
            
            Focus on practical features and specific details rather than marketing language.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 1.3,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    // Parse and validate descriptions
    let descriptions: string[];
    try {
      const content = data.choices[0].message.content;
      descriptions = Array.isArray(JSON.parse(content)) ? JSON.parse(content) : [];
      console.log('Parsed descriptions:', descriptions);
      
      if (!descriptions || descriptions.length !== 8) {
        throw new Error('Did not receive exactly 8 descriptions');
      }
    } catch (error) {
      console.error('Error parsing descriptions:', error);
      throw new Error('Failed to parse descriptions');
    }

    // Generate clear titles from descriptions
    console.log('Generating titles from descriptions...');
    const titlesPromises = descriptions.map(desc => generateTitleFromDescription(desc));
    const titles = await Promise.all(titlesPromises);
    
    console.log('Generated titles:', titles);

    // Combine titles with descriptions
    const suggestions = descriptions.map((description, index) => ({
      title: titles[index],
      description: description
    }));

    // Log metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'success',
      cache_hit: false
    });

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        } 
      }
    );
      
  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    console.error('Stack trace:', error.stack);
    
    // Log error metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'error',
      error_message: error.message,
      cache_hit: false
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate gift suggestions',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
      }
    );
  }
});