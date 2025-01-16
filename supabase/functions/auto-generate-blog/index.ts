import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log('Starting automated blog post generation');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date and time
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    console.log(`Checking for posts scheduled for ${today} at or before ${currentTime}`);

    // Check posts processed today
    const { data: processedToday, error: countError } = await supabase
      .from('blog_post_queue')
      .select('id')
      .eq('status', 'completed')
      .eq('scheduled_date', today);

    if (countError) {
      throw new Error(`Error checking processed posts: ${countError.message}`);
    }

    if (processedToday && processedToday.length >= 3) {
      console.log('Already processed 3 posts today, waiting for tomorrow');
      return new Response(
        JSON.stringify({ message: 'Daily post limit reached' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the next pending post
    const { data: queueItem, error: queueError } = await supabase
      .from('blog_post_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(1)
      .single();

    if (queueError || !queueItem) {
      console.log('No pending posts found:', queueError);
      return new Response(
        JSON.stringify({ message: 'No pending posts found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if it's time to process this post
    if (queueItem.scheduled_date === today && queueItem.scheduled_time > currentTime) {
      console.log('Next post is scheduled for later today');
      return new Response(
        JSON.stringify({ message: 'Next post scheduled for later' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing queue item:', queueItem);

    // Step 1: Generate featured image with detailed prompt
    console.log('Step 1: Generating featured image');
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Create an entertaining, interesting, and funny image for a blog post about ${queueItem.title}. The image should be visually engaging and fill the entire frame with the subject matter. Ensure the composition is balanced and the subject is clearly visible. Use vibrant colors and interesting lighting. Do not include any text or typography in the image. Make it visually appealing for a blog header.`,
        n: 1,
        size: "1792x1024",
        quality: "standard",
        response_format: "b64_json"
      }),
    });

    if (!imageResponse.ok) {
      throw new Error(`OpenAI API error: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const buffer = Buffer.from(imageData.data[0].b64_json, 'base64');
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
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    console.log('Generated and uploaded image:', publicUrl);

    // Step 2: Generate SEO-optimized content components
    console.log('Step 2: Generating content components');
    const contentPromises = [
      {
        type: 'excerpt',
        prompt: "Write a compelling 2-3 sentence excerpt that hooks readers and summarizes the key value of this gift guide."
      },
      {
        type: 'seo-title',
        prompt: "Create an SEO-optimized title that includes relevant keywords while maintaining readability."
      },
      {
        type: 'seo-description',
        prompt: "Write a detailed meta description that includes key benefits and encourages clicks (150-160 characters)."
      },
      {
        type: 'seo-keywords',
        prompt: "Generate relevant keywords focusing on gift-giving, specific occasions, and target audiences."
      },
      {
        type: 'improve-content',
        prompt: `Create a detailed, engaging blog post about ${queueItem.title}. Include:
        1. A compelling introduction (150-250 words) that hooks the reader
        2. Clear sections with H2 and H3 headings
        3. At least 5 specific product recommendations with [PRODUCT_PLACEHOLDER] tags
        4. Detailed descriptions of why each product is a great gift
        5. Key features and benefits for each product
        6. Practical examples and scenarios
        7. A strong conclusion with a call to action
        8. Natural use of emojis throughout
        9. Proper paragraph spacing for readability
        10. Minimum 1500 words
        Make product titles VERY specific with brand names and models for accurate Amazon matching.`
      }
    ].map(async ({ type, prompt }) => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "You are a professional blog content writer specializing in gift recommendations. Create engaging, SEO-optimized content that follows the provided structure." 
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: type === 'improve-content' ? 2500 : 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${type}`);
      }

      const data = await response.json();
      return { type, content: data.choices[0].message.content };
    });

    const [
      excerptResult,
      seoTitleResult,
      seoDescriptionResult,
      seoKeywordsResult,
      contentResult
    ] = await Promise.all(contentPromises);

    console.log('Generated all content components');

    // Step 3: Process content to add Amazon product data
    console.log('Step 3: Processing content with Amazon product data');
    const processedContent = await fetch('https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/process-blog-content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content: contentResult.content,
        associateId: Deno.env.get('AMAZON_ASSOCIATE_ID')
      }),
    }).then(res => res.json());

    if (!processedContent || processedContent.error) {
      throw new Error('Failed to process content with Amazon data');
    }

    // Generate slug from title
    const slug = queueItem.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Step 4: Create the blog post
    console.log('Step 4: Creating blog post');
    const { error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: queueItem.title,
        slug,
        content: processedContent.content,
        excerpt: excerptResult.content,
        author: 'Get The Gift Team',
        image_url: publicUrl,
        meta_title: seoTitleResult.content,
        meta_description: seoDescriptionResult.content,
        meta_keywords: seoKeywordsResult.content,
        published_at: new Date().toISOString(),
        affiliate_links: processedContent.affiliateLinks
      });

    if (insertError) {
      throw new Error(`Failed to create blog post: ${insertError.message}`);
    }

    // Step 5: Update queue item status
    console.log('Step 5: Updating queue item status');
    const { error: updateError } = await supabase
      .from('blog_post_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', queueItem.id);

    if (updateError) {
      console.error('Failed to update queue item:', updateError);
    }

    console.log('Blog post generation completed successfully');

    return new Response(
      JSON.stringify({ message: 'Blog post generated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-generate-blog function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});