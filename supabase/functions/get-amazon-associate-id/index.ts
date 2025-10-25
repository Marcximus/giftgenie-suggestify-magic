import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const AMAZON_ASSOCIATE_ID_US = Deno.env.get('AMAZON_ASSOCIATE_ID')
  const AMAZON_ASSOCIATE_ID_UK = Deno.env.get('AMAZON_ASSOCIATE_ID_UK')

  // Build affiliate IDs map
  const affiliateIds: Record<string, string> = {
    US: AMAZON_ASSOCIATE_ID_US || '',
    GB: AMAZON_ASSOCIATE_ID_UK || AMAZON_ASSOCIATE_ID_US || '', // Fallback to US if UK not set
  }

  // Get country from Cloudflare header if available
  const country = req.headers.get('CF-IPCountry') || 'US'

  return new Response(
    JSON.stringify({ 
      affiliateIds,
      detectedCountry: country 
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})