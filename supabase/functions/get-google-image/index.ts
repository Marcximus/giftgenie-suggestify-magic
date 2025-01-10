import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchTerm } = await req.json()
    console.log('Searching Google Images for:', searchTerm)
    
    if (!searchTerm) {
      throw new Error('Search term is required')
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY')
    const SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      throw new Error('Google API configuration is missing')
    }

    // Clean up search term and add "product" to get more product-focused images
    const query = `${searchTerm} product`.trim().replace(/\s+/g, '+')
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${query}&num=1`,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from Google API')
    }

    const data = await response.json()
    const imageUrl = data.items?.[0]?.link || null
    
    if (!imageUrl) {
      throw new Error('No image found')
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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