import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { generateBlogContent } from "../_shared/blog-content-generator.ts";
import { processContent } from "../_shared/content-processor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID')!;
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')!;

    // Get pending blog post from queue
    const { data: queueItem, error: queueError } = await supabase
      .from('blog_post_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (queueError) {
      console.error('Error fetching from queue:', queueError);
      throw queueError;
    }

    if (!queueItem) {
      console.log('No pending blog posts in queue');
      return new Response(
        JSON.stringify({ message: 'No pending blog posts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('blog_post_queue')
      .update({ status: 'processing' })
      .eq('id', queueItem.id);

    try {
      // Generate blog content
      console.log('Generating content for:', queueItem.title);
      const rawContent = await generateBlogContent(queueItem.title, 200, 5, 'gift');

      // Process content with Amazon product data
      console.log('Processing content with Amazon data');
      const { content, affiliateLinks } = await processContent(rawContent, associateId, rapidApiKey);

      // Generate slug from title
      const slug = queueItem.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Generate meta description from first paragraph
      const firstParagraph = content.split('\n')[0].slice(0, 160);
      
      // Insert blog post
      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([
          {
            title: queueItem.title,
            slug,
            content,
            excerpt: firstParagraph,
            author: 'Get The Gift Team',
            affiliate_links: affiliateLinks,
            published_at: new Date().toISOString(),
            meta_title: queueItem.title,
            meta_description: firstParagraph,
            meta_keywords: queueItem.title.toLowerCase().split(' ').join(', '),
          }
        ]);

      if (insertError) {
        console.error('Error inserting blog post:', insertError);
        throw insertError;
      }

      // Update queue item status to completed
      await supabase
        .from('blog_post_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      console.log('Successfully generated and published blog post:', queueItem.title);
      
      return new Response(
        JSON.stringify({ 
          message: 'Blog post generated successfully',
          title: queueItem.title
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error generating blog post:', error);
      
      // Mark as failed without retrying
      await supabase
        .from('blog_post_queue')
        .update({ 
          status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      throw error;
    }

  } catch (error) {
    console.error('Error in auto-generate-blog function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});