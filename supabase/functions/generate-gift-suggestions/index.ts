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
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI API with prompt:', prompt);

    // Add retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
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
                content: `You are a gift suggestion assistant. Generate exactly 3 gift suggestions based on the description provided. 
                Format your response as a JSON array of objects, where each object has these exact fields:
                - title: A short, clear name for the gift
                - description: A brief description of the gift
                - priceRange: An estimated price range (e.g., "$20-$30")
                - reason: Why this gift would be a good fit
                
                Example format:
                [
                  {
                    "title": "Wireless Earbuds",
                    "description": "High-quality wireless earbuds with noise cancellation",
                    "priceRange": "$80-$120",
                    "reason": "Perfect for music lovers who value convenience"
                  }
                ]`
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (response.status === 429) {
          console.log(`Rate limited (attempt ${retryCount + 1}/${maxRetries}), waiting before retry...`);
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          await delay(waitTime);
          retryCount++;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.text();
          console.error('OpenAI API error:', errorData);
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
        lastError = error;
        if (error.message.includes('429') && retryCount < maxRetries - 1) {
          retryCount++;
          const waitTime = Math.pow(2, retryCount) * 1000;
          await delay(waitTime);
          continue;
        }
        break;
      }
    }

    // If we get here, all retries failed
    console.error('All retries failed:', lastError);
    throw lastError;

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});