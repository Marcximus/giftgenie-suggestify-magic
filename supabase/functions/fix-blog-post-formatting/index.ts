import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: post } = await supabase
      .from('blog_posts')
      .select('content')
      .eq('slug', 'the-10-best-gifts-for-dads')
      .single()

    if (!post) {
      throw new Error('Post not found')
    }

    // Format the content
    let formattedContent = post.content
    
    // Center the headline (h1)
    formattedContent = formattedContent.replace(
      /<h1[^>]*>/g,
      '<h1 class="text-center mb-8">'
    )

    // Center product titles (h3)
    formattedContent = formattedContent.replace(
      /<h3[^>]*>/g,
      '<h3 class="text-center mb-4">'
    )

    // Left align paragraphs
    formattedContent = formattedContent.replace(
      /<p[^>]*>/g,
      '<p class="text-left mb-4">'
    )

    // Center Amazon buttons
    formattedContent = formattedContent.replace(
      /<a[^>]*class="[^"]*amazon-button[^"]*"[^>]*>/g,
      (match) => match.replace(/class="([^"]*)"/, 'class="$1 mx-auto block text-center"')
    )

    // Update the post
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: formattedContent })
      .eq('slug', 'the-10-best-gifts-for-dads')

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true }),
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
        status: 400,
      }
    )
  }
})