import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { descriptions } = await req.json();
    
    if (!Array.isArray(descriptions)) {
      throw new Error('Expected an array of description requests');
    }

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
            content: `You are a concise product description writer. Your task is to:
1. Create descriptions that are EXACTLY 18 WORDS OR LESS
2. Focus on the main benefit or feature
3. Use clear, professional language
4. Avoid marketing fluff
5. Be specific and factual

Example formats:
- "This [product] delivers [key benefit] for [recipient type], featuring [main feature]."
- "Crafted with [quality], this [product] provides [benefit] perfect for [specific use]."

Return ONLY an array of strings in JSON format, no additional text or markdown.`
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', data.choices[0].message.content);
    
    // Clean and parse the response
    let cleanedContent = data.choices[0].message.content;
    // Remove any markdown code blocks
    cleanedContent = cleanedContent.replace(/```json\n|\n```/g, '');
    // Remove any trailing/leading whitespace
    cleanedContent = cleanedContent.trim();
    
    // Parse the cleaned content
    let generatedDescriptions;
    try {
      generatedDescriptions = JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.log('Cleaned content that failed to parse:', cleanedContent);
      throw new Error('Failed to parse OpenAI response into valid JSON');
    }
    
    // Validate the parsed descriptions
    if (!Array.isArray(generatedDescriptions)) {
      throw new Error('Expected an array of descriptions from OpenAI');
    }

    // Ensure all descriptions are strings and properly formatted
    const validatedDescriptions = generatedDescriptions.map((desc: any) => {
      if (typeof desc !== 'string') {
        throw new Error('Each description must be a string');
      }
      return desc.trim();
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