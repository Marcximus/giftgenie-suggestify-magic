import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();
    console.log('Generating title for:', { 
      originalTitle: title,
      description: description?.substring(0, 100) + '...' // Log truncated description
    });

    if (!title) {
      throw new Error('Title is required');
    }

    const prompt = `As a product title specialist, create a clear, concise title for this product. Here's the context:

Original Title: "${title}"
Product Description: "${description || 'Not provided'}"

CRITICAL TITLE FORMATTING RULES:
1. Keep essential product feature/type/category words
2. Include brand name only if it's well-known
4. Remove model numbers unless crucial
5. Maximum 5-7 words
6. Preserve purpose-specific terms

STUDY THESE EXAMPLES CAREFULLY:
BAD: "The Perky-Pet 114B Squirrel Stumper Premium Bird Feeder with Advanced Protection System"
GOOD: "Anti-Squirrel Bird Feeder"

BAD: "Celestron Nature DX 8x42 Professional Grade Binoculars with ED Glass"
GOOD: "Celestron Nature Binoculars"

BAD: "SITKA Gear Men's Core Lightweight Hunting Hoody with Advanced Odor Control"
GOOD: "SITKA Hunting Hoody"

BAD: "The Plano EDGE 3700 Premium Professional Grade Tackle Storage System"
GOOD: "Plano Utility Box"

BAD: "Harney & Sons Tower of London Premium Loose Leaf Black Tea Blend"
GOOD: "Harney & Sons Black Tea"

Return ONLY the final title, no explanations or additional text.`;

    console.log('Sending request to DeepSeek API with temperature:', 0.3);

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
            content: "You are a product title specialist that follows the rules exactly and returns only the simplified title."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.3,
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
      generatedTitle: data.choices?.[0]?.message?.content
    });

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const simplifiedTitle = data.choices[0].message.content.trim();
    console.log('Title transformation:', {
      original: title,
      simplified: simplifiedTitle,
      charactersReduced: title.length - simplifiedTitle.length,
      percentageReduction: ((title.length - simplifiedTitle.length) / title.length * 100).toFixed(1) + '%'
    });

    return new Response(
      JSON.stringify({ title: simplifiedTitle }),
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
        error: 'Failed to generate product title',
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