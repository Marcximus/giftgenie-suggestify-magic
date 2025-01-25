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
    const requestData = await req.json();
    console.log('Received request data:', requestData);

    // Handle both single title and batch requests
    const titlesToProcess = requestData.titles || [requestData];
    
    if (!Array.isArray(titlesToProcess)) {
      throw new Error('Invalid request format. Expected titles array or single title object');
    }

    // Create a single prompt for all titles
    const titlesPrompt = titlesToProcess.map((item, index) => `
Product ${index + 1}: "${item.title}"
Description: "${item.description || 'Not provided'}"
`).join('\n');

    const prompt = `As a product title specialist, create clear, concise titles (max 5-7 words) for these products.

${titlesPrompt}

RULES:
1. Keep essential product features and brand names
2. Remove unnecessary words and model numbers
3. Focus on the main purpose/benefit

EXAMPLES:
Original: "The Perky-Pet 114B Squirrel Stumper Premium Bird Feeder with Advanced Protection System"
Better: "Anti-Squirrel Bird Feeder"

Original: "Celestron Nature DX 8x42 Professional Grade Binoculars with ED Glass"
Better: "Celestron Nature Binoculars"

Return each title on a new line, without numbering or prefixes.`;

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
        temperature: 1.3,
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

    // Split response into array of titles and clean up any numbering or extra whitespace
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

    // If it was a single title request, return just that title
    const result = requestData.titles ? { titles: generatedTitles } : { title: generatedTitles[0] };

    console.log('Batch processing complete:', {
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