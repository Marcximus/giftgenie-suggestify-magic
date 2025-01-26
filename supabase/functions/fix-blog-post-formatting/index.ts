import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all blog posts
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, content, slug')

    if (fetchError) throw fetchError
    if (!posts || posts.length === 0) {
      throw new Error('No posts found')
    }

    const results = []

    for (const post of posts) {
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})