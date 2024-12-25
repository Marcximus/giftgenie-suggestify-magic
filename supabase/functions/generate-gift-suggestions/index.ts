import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced delay calculation with more aggressive backoff and randomization
const calculateDelay = (retryCount: number) => {
  const baseDelay = 2000; // 2 seconds base delay
  const maxDelay = 30000; // 30 seconds max
  const exponentialDelay = Math.pow(2, retryCount) * baseDelay;
  const jitter = Math.random() * exponentialDelay * 0.5; // Up to 50% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify OpenAI API key is present
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    const maxRetries = 3; // Reduced max retries but with longer delays
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1}/${maxRetries} to call OpenAI API`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Using more reliable model
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
          console.error(`OpenAI API error response (attempt ${retryCount + 1}/${maxRetries}):`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });

          // Handle rate limits with longer delays
          if (response.status === 429) {
            const waitTime = calculateDelay(retryCount);
            console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            continue;
          }

          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('OpenAI API response received');

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
        const waitTime = calculateDelay(retryCount);
        console.log(`Error occurred (${error.message}), retrying in ${waitTime}ms...`);
        
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
          continue;
        }
        break;
      }
    }

    console.error('Max retries reached. Last error:', lastError);
    throw new Error('Service temporarily unavailable. Please try again in a few moments.');

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'The service is temporarily unavailable. Please try again in a few moments.'
    }), {
      status: 503, // Changed to 503 Service Unavailable
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});