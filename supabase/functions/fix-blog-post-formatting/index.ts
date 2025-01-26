import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting blog post formatting fix...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all blog posts
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, content, slug')

    if (fetchError) {
      console.error('Error fetching posts:', fetchError)
      throw fetchError
    }

    if (!posts || posts.length === 0) {
      console.log('No posts found to process')
      throw new Error('No posts found')
    }

    console.log(`Found ${posts.length} posts to process`)
    const results = []

    for (const post of posts) {
      console.log(`Processing post: ${post.slug}`)
      let formattedContent = post.content

      // Center the headline (h1)
      formattedContent = formattedContent.replace(
        /(<h1[^>]*>)/g,
        '<h1 style="text-align: center !important;" class="!text-center mt-4 sm:mt-8 mb-6 sm:mb-12 px-8">'
      )

      // Center product titles (h3)
      formattedContent = formattedContent.replace(
        /(<h3[^>]*>)/g,
        '<h3 style="text-align: center !important;" class="!text-center !mb-16 !mt-16 text-xl font-semibold">'
      )

      // Left align paragraphs and ensure proper spacing
      formattedContent = formattedContent.replace(
        /(<p[^>]*>)/g,
        '<p style="text-align: left !important;" class="!text-left mb-4">'
      )

      // Center Amazon buttons and add proper spacing
      formattedContent = formattedContent.replace(
        /<div[^>]*class="[^"]*product-actions[^"]*"[^>]*>/g,
        '<div class="!text-center flex flex-col items-center gap-2 my-2">'
      )

      // Update the post with formatted content
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ content: formattedContent })
        .eq('id', post.id)

      if (updateError) {
        console.error(`Error updating post ${post.slug}:`, updateError)
      } else {
        console.log(`Successfully updated post: ${post.slug}`)
      }

      results.push({
        slug: post.slug,
        success: !updateError,
        error: updateError?.message
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        processed: results.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fix-blog-post-formatting:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})