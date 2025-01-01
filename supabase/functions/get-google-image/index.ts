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
    const encodedQuery = encodeURIComponent(query)
    
    console.log('Making request to Google Custom Search API with query:', query)
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${encodedQuery}&num=1&imgSize=LARGE&imgType=photo&safe=active`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded')
      }
      throw new Error(`Google API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.items?.[0]?.link) {
      console.error('No image found in response:', data)
      throw new Error('No image found in search results')
    }

    const imageUrl = data.items[0].link
    console.log('Successfully found image:', imageUrl)

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache successful responses for 1 hour
        } 
      }
    )
  } catch (error) {
    console.error('Error in get-google-image function:', error)
    
    let status = 500
    let message = error.message || 'An unexpected error occurred'
    
    if (message.includes('Rate limit')) {
      status = 429
    }

    return new Response(
      JSON.stringify({ 
        error: message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
      }
    )
  }
})