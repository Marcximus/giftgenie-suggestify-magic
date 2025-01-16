import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateBlogPost(queueItem: any) {
  console.log('Starting blog post generation for:', queueItem.title);
  
  try {
    // 1. Get the next pending title from queue
    const title = queueItem.title;
    console.log('Using title:', title);

    // 2. Generate featured image
    console.log('Generating featured image...');
    const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
      body: { 
        title,
        prompt: "Create an entertaining, interesting, and funny image for a blog post" 
      }
    });
    if (imageError) throw imageError;
    const imageUrl = imageData.imageUrl;
    
    // 3. Generate alt text
    console.log('Generating alt text...');
    const { data: altData, error: altError } = await supabase.functions.invoke('generate-blog-image', {
      body: { 
        title,
        prompt: "Generate a descriptive alt text for this blog post's featured image" 
      }
    });
    if (altError) throw altError;
    const altText = altData.altText;

    // 4. Generate excerpt
    console.log('Generating excerpt...');
    const { data: excerptData, error: excerptError } = await supabase.functions.invoke('generate-blog-content', {
      body: { type: 'excerpt', title, content: '' }
    });
    if (excerptError) throw excerptError;
    const excerpt = excerptData.content;

    // 5. Generate full post content
    console.log('Generating full post content...');
    const { data: postData, error: postError } = await supabase.functions.invoke('generate-blog-post', {
      body: { title }
    });
    if (postError) throw postError;
    const content = postData.content;
    const affiliateLinks = postData.affiliateLinks || [];

    // 6. Generate SEO content
    console.log('Generating SEO content...');
    const { data: seoTitleData } = await supabase.functions.invoke('generate-blog-content', {
      body: { type: 'seo-title', title, content }
    });
    const { data: seoDescData } = await supabase.functions.invoke('generate-blog-content', {
      body: { type: 'seo-description', title, content }
    });
    const { data: seoKeywordsData } = await supabase.functions.invoke('generate-blog-content', {
      body: { type: 'seo-keywords', title, content }
    });

    // 7. Create the slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // 8. Insert the blog post
    const { error: insertError } = await supabase
      .from('blog_posts')
      .insert([{
        title,
        slug,
        content,
        excerpt,
        author: 'Get The Gift Team',
        image_url: imageUrl,
        image_alt_text: altText,
        meta_title: seoTitleData.content,
        meta_description: seoDescData.content,
        meta_keywords: seoKeywordsData.content,
        affiliate_links: affiliateLinks,
        published_at: new Date().toISOString()
      }]);

    if (insertError) throw insertError;

    // 9. Update queue item status
    await supabase
      .from('blog_post_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);

    console.log('Blog post generation completed successfully');
    return { success: true };

  } catch (error) {
    console.error('Error generating blog post:', error);
    
    // Update queue item with error
    await supabase
      .from('blog_post_queue')
      .update({ 
        status: 'failed',
        processed_at: new Date().toISOString(),
        error_message: error.message,
        retries: (queueItem.retries || 0) + 1
      })
      .eq('id', queueItem.id);

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a manual trigger or scheduled trigger
    const { queueId } = await req.json().catch(() => ({}));
    
    let queueItem;
    if (queueId) {
      // Manual trigger for specific queue item
      const { data, error } = await supabase
        .from('blog_post_queue')
        .select('*')
        .eq('id', queueId)
        .single();
      
      if (error) throw error;
      queueItem = data;
    } else {
      // Get next scheduled item
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
      const currentDate = now.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('blog_post_queue')
        .select('*')
        .eq('status', 'pending')
        .eq('scheduled_date', currentDate)
        .lte('scheduled_time', currentTime)
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ message: 'No posts scheduled for processing' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }
      queueItem = data;
    }

    const result = await generateBlogPost(queueItem);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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