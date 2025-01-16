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
      .lte('scheduled_date', today) // scheduled for today or earlier
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

    // Step 1: Generate image
    const imageResponse = await fetch('https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/generate-blog-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: queueItem.title }),
    });

    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }

    const { imageUrl } = await imageResponse.json();
    console.log('Generated image URL:', imageUrl);

    // Step 2-5: Generate content components
    const contentPromises = ['excerpt', 'seo-title', 'seo-description', 'seo-keywords', 'improve-content'].map(type =>
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

    // Create the blog post
    const { error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: queueItem.title,
        slug,
        content: contentResult.content,
        excerpt: excerptResult.content,
        author: 'Get The Gift Team',
        image_url: imageUrl,
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