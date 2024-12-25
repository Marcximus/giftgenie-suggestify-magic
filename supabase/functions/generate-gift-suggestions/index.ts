import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful gift suggestion assistant. Provide 3 specific gift suggestions based on the description provided. For each suggestion, include: title, description, estimated price range, and why it would be a good fit. Format the response as a JSON array with objects containing these fields.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    let suggestions;
    try {
      suggestions = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      suggestions = [{
        title: "Error parsing suggestions",
        description: "Failed to process the AI response. Please try again.",
        priceRange: "N/A",
        reason: "Error occurred"
      }];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});