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

    const API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY')
    const SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')

    if (!API_KEY || !SEARCH_ENGINE_ID) {
      console.error('Missing Google Search credentials')
      throw new Error('Google Search credentials not configured')
    }

    // Clean up search term and add product-specific terms
    const query = `${searchTerm} product white background`.trim()
    
    console.log('Making request to Google API with query:', query)
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${encodeURIComponent(query)}&num=1&imgSize=LARGE&imgType=photo`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Google API response not OK:', response.status, response.statusText)
      throw new Error(`Google API returned status ${response.status}`)
    }

    const data = await response.json()
    console.log('Google API response received')
    
    const imageUrl = data.items?.[0]?.link

    if (!imageUrl) {
      console.error('No image found in Google API response')
      throw new Error('No image found')
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in get-google-image function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})