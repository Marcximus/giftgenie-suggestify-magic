import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleRateLimit = async (response: Response) => {
  const retryAfter = response.headers.get('retry-after');
  const delayMs = (retryAfter ? parseInt(retryAfter) : 60) * 1000;
  console.log(`Rate limited by OpenAI, waiting ${delayMs}ms...`);
  await delay(delayMs);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Generating image for title:', title);

    // Create a more focused image prompt
    const imagePrompt = `Create a creative and engaging scene that directly relates to ${title}. 
    
IMPORTANT REQUIREMENTS:
- Absolutely NO text, letters, numbers, or writing of any kind
- Absolutely NO logos or brand names
- Create a scene that clearly connects to the subject mentioned in the title
- Fill the entire frame with the scene (NO blank space or borders)
- Ensure elements in the image relates to the title: ${title}

STYLE & VARIATION INSPIRATION:
- Choose a random style from: classic painting, watercolor, 8-bit pixel art, surreal collage, vibrant pop art, dreamy cinematic lighting, whimsical cartoons, abstract paintings`;

    // Create OpenAI image with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Attempt ${attempts + 1} to generate image...`);
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1792x1024",
            quality: "standard",
            response_format: "b64_json",
            style: "vivid"
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            await handleRateLimit(response);
            attempts++;
            continue;
          }
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

        return new Response(
          JSON.stringify({ imageUrl: publicUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        lastError = error;
        attempts++;
        if (attempts < maxAttempts) {
          const delayMs = 2000 * Math.pow(2, attempts);
          console.log(`Waiting ${delayMs}ms before retry...`);
          await delay(delayMs);
        }
      }
    }

    throw lastError || new Error('Failed to generate image after all attempts');
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