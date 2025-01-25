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
      description: description?.substring(0, 50) + '...' // Log shorter description
    });

    if (!title) {
      throw new Error('Title is required');
    }

    // Optimized prompt with fewer tokens
    const prompt = `Simplify this product title while keeping key features:
Original: "${title}"
Context: "${description?.substring(0, 100) || 'Not provided'}"

Rules:
1. Keep brand if known
2. Max 5-7 words
3. Include key features
4. Remove model numbers
5. Keep purpose terms

Return ONLY the final title.`;

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
            content: "You are a product title optimizer. Return only the simplified title."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 50, // Reduced from 100
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
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});