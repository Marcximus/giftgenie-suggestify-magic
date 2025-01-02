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
    
    if (!searchTerm) {
      throw new Error('Search term is required')
    }

    // Clean and encode the search term
    const cleanedSearchTerm = searchTerm
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '+')

    console.log('Searching for product:', cleanedSearchTerm)

    const SCRAPING_DOG_API_KEY = Deno.env.get('SCRAPINGDOG_API_KEY')
    if (!SCRAPING_DOG_API_KEY) {
      throw new Error('ScrapingDog API key not configured')
    }

    // First, search for the product to get its ASIN
    const searchUrl = `https://api.scrapingdog.com/amazon?api_key=${SCRAPING_DOG_API_KEY}&type=search&q=${cleanedSearchTerm}`
    
    console.log('Making search request to:', searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('Search API failed:', searchResponse.status, '-', errorText)
      throw new Error(`Search API failed: ${searchResponse.status} - ${errorText}`)
    }

    const searchData = await searchResponse.json()
    console.log('Search API response:', JSON.stringify(searchData))

    if (!searchData || !searchData.length || !searchData[0]?.asin) {
      throw new Error('No products found')
    }

    const asin = searchData[0].asin
    console.log('Found ASIN:', asin)

    // Now get the specific product details using the ASIN
    const productUrl = `https://api.scrapingdog.com/amazon?api_key=${SCRAPING_DOG_API_KEY}&type=product&asin=${asin}`
    
    console.log('Fetching product details from:', productUrl)
    
    const productResponse = await fetch(productUrl)
    if (!productResponse.ok) {
      const errorText = await productResponse.text()
      console.error('Product API failed:', productResponse.status, '-', errorText)
      throw new Error(`Product API failed: ${productResponse.status} - ${errorText}`)
    }

    const productData = await productResponse.json()
    console.log('Product API response:', JSON.stringify(productData))

    if (!productData || !productData.title) {
      throw new Error('Invalid product data received')
    }

    const AMAZON_ASSOCIATE_ID = Deno.env.get('AMAZON_ASSOCIATE_ID')
    const productLink = `https://www.amazon.com/dp/${asin}${AMAZON_ASSOCIATE_ID ? `?tag=${AMAZON_ASSOCIATE_ID}` : ''}`

    const response = {
      title: productData.title,
      price: productData.price || 'Price not available',
      imageUrl: productData.image || null,
      productUrl: productLink,
      asin: asin
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in get-amazon-product:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to fetch Amazon product data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})