import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { descriptions } = await req.json();
    
    if (!Array.isArray(descriptions)) {
      throw new Error('Expected an array of description requests');
    }

    console.log('Processing descriptions batch:', descriptions.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a concise product description writer. Your task is to create descriptions that are EXACTLY 18 WORDS OR LESS.
Focus on the main benefit or feature. Use clear, professional language. Avoid marketing fluff. Be specific and factual.

CRITICAL: Return ONLY a plain JSON array of strings. No code blocks, no markdown, no explanations.
Example: ["First product description", "Second product description"]`
          },
          {
            role: "user",
            content: `Create 18-word or less descriptions for these products:\n\n${descriptions.map((d: any, i: number) => 
              `${i + 1}. Product: ${d.title}\nOriginal: ${d.description}\n`
            ).join('\n')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', data.choices[0].message.content);
    
    let cleanedContent = data.choices[0].message.content.trim();
    
    // Extract just the array part if there's any extra text
    const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      cleanedContent = arrayMatch[0];
    }
    
    console.log('Cleaned content:', cleanedContent);
    
    let generatedDescriptions;
    try {
      generatedDescriptions = JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.log('Content that failed to parse:', cleanedContent);
      throw new Error('Failed to parse OpenAI response into valid JSON');
    }
    
    if (!Array.isArray(generatedDescriptions)) {
      console.error('Invalid response format:', generatedDescriptions);
      throw new Error('Expected an array of descriptions from OpenAI');
    }

    const validatedDescriptions = generatedDescriptions.map((desc: any, index: number) => {
      if (typeof desc !== 'string') {
        console.error(`Invalid description at index ${index}:`, desc);
        throw new Error(`Description at index ${index} must be a string`);
      }
      const trimmed = desc.trim();
      const wordCount = trimmed.split(/\s+/).length;
      console.log(`Description ${index + 1} word count:`, wordCount);
      
      if (wordCount > 18) {
        console.warn(`Description ${index + 1} exceeds 18 words (${wordCount} words)`);
      }
      
      return trimmed;
    });

    return new Response(
      JSON.stringify({ descriptions: validatedDescriptions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-custom-description:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});