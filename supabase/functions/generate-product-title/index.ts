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
    console.log('Generating title for:', { originalTitle: title, description });

    if (!title) {
      throw new Error('Title is required');
    }

    const prompt = `As a product title specialist, create a clear, concise title for this product. Here's the context:

Original Title: "${title}"
Product Description: "${description || 'Not provided'}"

CRITICAL TITLE FORMATTING RULES:
1. Keep essential product type/category words (e.g., "Cleaning Kit", "Photo Printer", "Gaming Mouse")
2. Include brand name only if it's well-known
3. Remove unnecessary words like "The", "Premium", "New", "Latest"
4. Remove model numbers unless crucial for identification
5. Maximum 5-7 words
6. Preserve purpose-specific terms (e.g., "Wireless", "Mechanical", "Ergonomic")

Examples of good transformations:
- "The Perky-Pet 114B Squirrel Stumper Premium Bird Feeder with Advanced Protection System" → "Perky-Pet Squirrel-Proof Bird Feeder"
- "Altura Photo Professional Cleaning Kit for DSLR Cameras and Sensitive Electronics" → "Altura Photo Professional Cleaning Kit"
- "The Polaroid Now 2nd Generation I-Type Instant Film Camera" → "Polaroid Now Instant Camera"

Return ONLY the final title, no explanations or additional text.`;

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
        temperature: 0.3, // Lower temperature for more consistent outputs
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const simplifiedTitle = data.choices[0].message.content.trim();
    console.log('Generated simplified title:', simplifiedTitle);

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
    console.error('Error in generate-product-title function:', error);
    
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