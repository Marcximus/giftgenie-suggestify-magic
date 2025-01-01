import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    // Verify OpenAI API key is present
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion assistant specializing in recommending highly relevant, purchasable products. Generate exactly 8 gift suggestions based on the description provided.

            Focus on these key aspects:
            1. Suggest specific, named products rather than generic categories
            2. Include current trends and popular items in the relevant category
            3. Consider the price range and recipient's interests carefully
            4. Emphasize unique features and benefits that make the gift special
            5. Include practical, useful items that solve problems or enhance daily life
            6. Mix both premium and value-oriented options within the specified budget
            
            Return ONLY a raw JSON array of objects, with NO markdown formatting, explanation, or additional text.
            Each object must have these exact fields:
            - title: A specific, searchable product name (e.g., "Sony WH-1000XM4 Wireless Noise-Cancelling Headphones" instead of just "Headphones")
            - description: A compelling description highlighting key features, benefits, and why it's perfect for the recipient
            - priceRange: A realistic price range based on current market prices
            - reason: A personalized explanation of why this specific item would make an excellent gift for the recipient`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    // Handle rate limits specifically
    if (response.status === 429) {
      console.error('OpenAI rate limit reached');
      return new Response(
        JSON.stringify({
          error: 'Rate limit reached',
          details: 'The service is experiencing high demand. Please wait a moment and try again.'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from OpenAI API:', data);
      throw new Error('Invalid response format from OpenAI API');
    }

    let suggestions;
    try {
      const content = data.choices[0].message.content;
      console.log('Raw content from OpenAI:', content);
      
      // Clean the content by removing any markdown formatting
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned content:', cleanedContent);
      
      suggestions = JSON.parse(cleanedContent);
      
      // Validate the structure of the suggestions
      if (!Array.isArray(suggestions) || suggestions.length !== 8) {
        console.error('Invalid suggestions array:', suggestions);
        throw new Error('Invalid suggestions format - expected array of 8 items');
      }

      suggestions.forEach((suggestion, index) => {
        if (!suggestion.title || !suggestion.description || !suggestion.priceRange || !suggestion.reason) {
          console.error(`Invalid suggestion at index ${index}:`, suggestion);
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
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'An error occurred while processing your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
