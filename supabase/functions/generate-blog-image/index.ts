import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, prompt } = await req.json();

    // If it's an alt text generation request
    if (prompt?.toLowerCase().includes('alt text')) {
      const altTextResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "system",
            content: "Generate a concise, descriptive alt text for an image. Focus on the main elements and purpose of the image."
          }, {
            role: "user",
            content: `Generate alt text for a blog post image about: ${title}`
          }],
          max_tokens: 100,
        }),
      });

      if (!altTextResponse.ok) {
        console.error('OpenAI API error (alt text):', await altTextResponse.text());
        throw new Error(`OpenAI API error (alt text): ${altTextResponse.status}`);
      }

      const altTextData = await altTextResponse.json();
      return new Response(
        JSON.stringify({ altText: altTextData.choices[0].message.content.trim() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the main subject from the title
    const subjectMatch = title.toLowerCase().match(/(?:for|to)\s+(?:a\s+)?(\w+)/i);
    const subject = subjectMatch ? subjectMatch[1] : '';

    const imagePrompt = `Create a creative and engaging scene that directly relates to ${title || 'gift-giving'}, focusing specifically on ${subject || 'the recipient'}.

IMPORTANT REQUIREMENTS:
- Absolutely NO text, letters, numbers, or writing of any kind
- Absolutely NO logos or brand names
- Create a scene that clearly connects to the subject and person mentioned: ${subject || 'the recipient'}
- The picture should be a rectangular horizontally oriented (16:9) that fills the entire frame with NO blank space or borders
- Ensure elements in the image relates to the title, the occasion and the person: ${title}

STYLE & VARIATION INSPIRATION:
- Choose a random style or combine multiple and experiment with for example classic painting, watercolor, 8-bit pixel art, surreal collage, vibrant pop art, dreamy cinematic lighting, whimsical cartoons, abstract paintings etc`;

    console.log('Generating image with prompt:', imagePrompt);

    // Create OpenAI image
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt || imagePrompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
        response_format: "b64_json",
        style: "vivid"
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.data[0].b64_json;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to Uint8Array
    const binaryString = atob(imageData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `${crypto.randomUUID()}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        details: error.stack,
        type: 'generate-blog-image-error'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        } 
      }
    );
  }
});