import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing request with prompt:', prompt);

    // Implement retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are a gift suggestion assistant. Generate exactly 3 gift suggestions based on the description provided. 
                Format your response as a JSON array of objects, where each object has these exact fields:
                - title: A short, clear name for the gift
                - description: A brief description of the gift
                - priceRange: An estimated price range (e.g., "$20-$30")
                - reason: Why this gift would be a good fit`
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error response (attempt ${retryCount + 1}/${maxRetries}):`, errorText);
          
          if (response.status === 429) {
            if (retryCount < maxRetries - 1) {
              const waitTime = Math.pow(2, retryCount + 1) * 1000; // 2s, 4s, 8s
              console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
              await delay(waitTime);
              retryCount++;
              continue;
            }
          }
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('OpenAI API response:', data);

        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from OpenAI API');
        }

        let suggestions;
        try {
          suggestions = JSON.parse(data.choices[0].message.content);
          
          if (!Array.isArray(suggestions) || suggestions.length !== 3) {
            throw new Error('Invalid suggestions format');
          }

          suggestions.forEach(suggestion => {
            if (!suggestion.title || !suggestion.description || !suggestion.priceRange || !suggestion.reason) {
              throw new Error('Missing required fields in suggestion');
            }
          });

        } catch (e) {
          console.error('Failed to parse OpenAI response:', e);
          throw new Error('Failed to parse AI response');
        }

        return new Response(JSON.stringify({ suggestions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        if (retryCount === maxRetries - 1) {
          throw error;
        }
        retryCount++;
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Error occurred, retrying in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }

    throw new Error('Max retries reached');

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});