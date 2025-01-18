import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchTerm } = await req.json()
    console.log('Searching for image:', searchTerm)

    const apiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY')
    const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')

    if (!apiKey || !searchEngineId) {
      throw new Error('Google Search API configuration missing')
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchTerm)}&searchType=image&num=1&safe=active`

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      console.error('Google Search API error:', data)
      throw new Error('Failed to fetch image from Google')
    }

    if (data.items?.[0]?.link) {
      console.log('Found image URL:', data.items[0].link)
      return new Response(
        JSON.stringify({ imageUrl: data.items[0].link }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('No image found for search term:', searchTerm)
    return new Response(
      JSON.stringify({ error: 'No image found' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      }
    )

  } catch (error) {
    console.error('Error in get-google-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})