import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const AMAZON_ASSOCIATE_ID = Deno.env.get('AMAZON_ASSOCIATE_ID')

  if (!AMAZON_ASSOCIATE_ID) {
    return new Response(
      JSON.stringify({ error: 'Amazon Associate ID not configured' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      }
    )
  }

  return new Response(
    JSON.stringify({ AMAZON_ASSOCIATE_ID }),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  )
})