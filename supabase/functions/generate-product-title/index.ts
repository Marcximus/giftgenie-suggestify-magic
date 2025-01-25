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
    const requestData = await req.json();
    console.log('Received request data:', requestData);

    const titlesToProcess = requestData.titles || [requestData];
    
    if (!Array.isArray(titlesToProcess)) {
      throw new Error('Invalid request format. Expected titles array or single title object');
    }

    // Process each title with a focused prompt
    const prompt = `As a product title specialist, optimize these product titles to be clear and marketable while preserving brand names and key features. Each title should be 3-7 words.

${titlesToProcess.map((item, index) => `
Original: "${item.title}"
Context: "${item.description || 'Not provided'}"
Key requirements:
1. Keep brand name if present
2. Keep main product type
3. Include one key distinguishing feature
4. Remove unnecessary words
5. Max 7 words`).join('\n')}

EXAMPLES:
Original: "The Perky-Pet 114B Squirrel Stumper Premium Bird Feeder with Advanced Protection System"
Better: "Perky-Pet Squirrel-Proof Bird Feeder"

Original: "Celestron Nature DX 8x42 Professional Grade Binoculars with ED Glass"
Better: "Celestron Nature DX Binoculars"

Return each optimized title on a new line, without numbering or additional text.`;

    console.log('Sending request to DeepSeek API');
    const startTime = performance.now();

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
            content: "You are a product title specialist that returns only simplified titles."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DeepSeek API response:', {
      rawResponse: data,
      processingTime: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const generatedTitles = data.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .map(title => title.replace(/^\d+\.\s*/, '').trim());

    if (generatedTitles.length !== titlesToProcess.length) {
      console.warn('Mismatch in number of titles:', {
        requested: titlesToProcess.length,
        received: generatedTitles.length
      });
    }

    const result = requestData.titles ? { titles: generatedTitles } : { title: generatedTitles[0] };

    console.log('Processing complete:', {
      requestedTitles: titlesToProcess.length,
      generatedTitles: generatedTitles.length,
      processingTime: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        } 
      }
    );
      
  } catch (error) {
    console.error('Error in generate-product-title function:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate product titles',
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