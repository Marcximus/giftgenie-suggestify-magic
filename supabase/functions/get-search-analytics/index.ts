import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get search analytics data
    const { data: searches, error } = await supabaseClient
      .from('search_analytics')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Convert to CSV format
    const csvRows = [
      // CSV Header
      ['Search Query', 'Suggestions', 'Created At', 'User Agent', 'IP Address'].join(','),
      // Data rows
      ...searches.map(row => [
        `"${row.search_query}"`,
        `"${JSON.stringify(row.suggestion_titles)}"`,
        row.created_at,
        `"${row.user_agent || ''}"`,
        `"${row.ip_address || ''}"`,
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=search-analytics.csv'
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})