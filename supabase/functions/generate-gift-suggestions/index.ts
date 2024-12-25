import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved delay function with jitter for better rate limit handling
const delay = (retryCount: number) => {
  const baseDelay = 1000; // Start with 1 second
  const maxDelay = 10000; // Cap at 10 seconds
  const jitter = Math.random() * 1000; // Add random jitter up to 1 second
  return Math.min(Math.pow(2, retryCount) * baseDelay + jitter, maxDelay);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing request with prompt:', prompt);

    const maxRetries = 5; // Increased max retries
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
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a gift suggestion assistant. Generate exactly 3 gift suggestions based on the description provided. 
                Format your response as a JSON array of objects, where each object has these exact fields:
                - title: A short, clear name for the gift
                - description: A brief description of the gift
                - priceRange: An estimated price range (e.g., "$20-$30")
                - reason: Why this gift would be a good fit`
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error response (attempt ${retryCount + 1}/${maxRetries}):`, errorText);
          
          if (response.status === 429) {
            const waitTime = delay(retryCount);
            console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            continue;
          }

          // For non-429 errors, throw immediately
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
          const waitTime = delay(retryCount);
          console.log(`Error occurred, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
          continue;
        }
        if (retryCount === maxRetries - 1) {
          break;
        }
      }
    }

    // If we've exhausted all retries, throw the last error
    throw lastError || new Error('Max retries reached');

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'The service is temporarily unavailable due to high demand. Please try again in a few moments.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});