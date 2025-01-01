import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchTerm } = await req.json()
    
    if (!searchTerm) {
      throw new Error('Search term is required')
    }

    const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY')
    if (!PEXELS_API_KEY) {
      throw new Error('Pexels API key not configured')
    }

    // Clean up search term and add "product" to get more product-focused images
    const query = `${searchTerm} product`.trim().replace(/\s+/g, '+')
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=square`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from Pexels API')
    }

    const data = await response.json()
    
    // Get the medium size image (typically 350x350)
    const imageUrl = data.photos[0]?.src?.medium || null
    
    if (!imageUrl) {
      throw new Error('No image found')
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in get-pexels-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})