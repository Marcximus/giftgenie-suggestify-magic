import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";

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

    // Extract the main subject from the title (e.g., "mum", "dad", "teenager")
    const subjectMatch = title.toLowerCase().match(/(?:for|to)\s+(?:a\s+)?(\w+)/i);
    const subject = subjectMatch ? subjectMatch[1] : '';

    // Create a more specific prompt based on the subject
    const defaultPrompt = `Create a photorealistic lifestyle image that represents gift-giving to ${subject || 'someone special'}. 
    The image should be a warm, inviting scene without any text, words, or typography.
    
    IMPORTANT REQUIREMENTS:
    - NO text, letters, numbers, or writing of any kind
    - NO logos or brand names
    - Show a lifestyle scene related to ${subject || 'the recipient'}
    - Use warm, inviting colors
    - Include gift-giving elements or wrapped presents
    - Make it personal and emotional
    - Ensure high quality and photorealistic style
    - Fill the entire frame with the scene
    
    Example scenes:
    - A beautifully decorated living room with wrapped gifts
    - A touching moment of gift exchange between family members
    - A celebration scene with presents in the background
    
    Subject context: ${title}`;

    // Create OpenAI image
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt || defaultPrompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
        response_format: "b64_json",
        style: "natural" // Use natural style for more photorealistic results
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error status:', response.status);
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.data[0].b64_json;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    const fileName = `${crypto.randomUUID()}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, buffer, {
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

    // Generate alt text if requested
    let altText = null;
    if (prompt?.toLowerCase().includes('alt text')) {
      const altTextResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4",
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

      if (altTextResponse.ok) {
        const altTextData = await altTextResponse.json();
        altText = altTextData.choices[0].message.content.trim();
      }
    }

    return new Response(
      JSON.stringify({ 
        imageUrl: publicUrl,
        altText 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});