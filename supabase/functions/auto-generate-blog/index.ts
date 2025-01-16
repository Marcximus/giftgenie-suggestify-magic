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
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    console.log(`Checking for posts scheduled for ${today} at or before ${currentTime}`);

    // First, check how many posts have been processed today
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

    // Get the next pending post that's scheduled for today or earlier
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

    // Step 1: Generate image with detailed prompt
    const imageResponse = await fetch('https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/generate-blog-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        title: queueItem.title,
        prompt: "Create an entertaining, interesting, and visually appealing image that captures the essence of this blog post topic. The image should be high-quality, engaging, and suitable for a gift-focused blog post. Do not include any text in the image."
      }),
    });

    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }

    const { imageUrl, altText } = await imageResponse.json();
    console.log('Generated image URL:', imageUrl);

    // Step 2-5: Generate content components with enhanced prompts
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
        prompt: "Create a detailed, engaging blog post with emojis, clear sections, and specific product recommendations. Include a compelling introduction (150-250 words), clear headings, and a conclusion with a call to action linking to the main gift finder."
      }
    ].map(({ type, prompt }) =>
      fetch('https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/generate-blog-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          title: queueItem.title,
          content: type === 'improve-content' ? queueItem.title : undefined,
          prompt
        }),
      }).then(res => res.json())
    );

    const [
      excerptResult,
      seoTitleResult,
      seoDescriptionResult,
      seoKeywordsResult,
      contentResult
    ] = await Promise.all(contentPromises);

    console.log('Generated content components');

    // Generate slug from title
    const slug = queueItem.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create the blog post with enhanced content
    const { error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: queueItem.title,
        slug,
        content: contentResult.content,
        excerpt: excerptResult.content,
        author: 'Get The Gift Team',
        image_url: imageUrl,
        image_alt_text: altText,
        meta_title: seoTitleResult.content,
        meta_description: seoDescriptionResult.content,
        meta_keywords: seoKeywordsResult.content,
        published_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to create blog post: ${insertError.message}`);
    }

    // Update queue item status
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