import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

interface TitleRequest {
  titles: Array<{
    title: string;
    description?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titles } = await req.json() as TitleRequest;
    console.log('Batch processing titles:', titles.length);

    if (!titles?.length) {
      throw new Error('Titles array is required');
    }

    // Create a single prompt for all titles
    const titlesPrompt = titles.map((item, index) => `
Product: "${item.title}"
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

    console.log('Sending batch request to DeepSeek API');
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
      .map(title => title.replace(/^\d+\.\s*/, '').trim()); // Remove any numbering

    if (generatedTitles.length !== titles.length) {
      console.warn('Mismatch in number of titles:', {
        requested: titles.length,
        received: generatedTitles.length
      });
    }

    console.log('Batch processing complete:', {
      requestedTitles: titles.length,
      generatedTitles: generatedTitles.length,
      processingTime: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    return new Response(
      JSON.stringify({ titles: generatedTitles }),
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