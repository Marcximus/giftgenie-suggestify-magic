import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processContent } from "../_shared/content-processor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    const numItems = 8; // Ensure we get enough product suggestions

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const amazonAssociateId = Deno.env.get('AMAZON_ASSOCIATE_ID');

    if (!openaiApiKey || !rapidApiKey || !amazonAssociateId) {
      throw new Error('Required environment variables are not set');
    }

    // Extract target demographic information from title
    const titleLower = title.toLowerCase();
    const isTeenage = titleLower.includes('teen') || titleLower.includes('teenage');
    const isFemale = titleLower.includes('sister') || titleLower.includes('girl') || titleLower.includes('daughter');
    
    // Build demographic-specific prompt
    const demographicContext = isTeenage && isFemale ? `
      CRITICAL: These suggestions are specifically for a teenage girl. Consider:
      - Current teen trends and interests
      - Age-appropriate items (13-19 years)
      - Popular brands among teenage girls
      - Social media and technology preferences
      - Creative expression and personal style
      - School and study needs
      - Social activities and hobbies
      - Beauty and fashion interests
      - Music and entertainment preferences
      - Room decoration and personalization
    ` : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a witty, entertaining blog writer specializing in gift recommendations. Create engaging, SEO-optimized content following these guidelines:

1. Title and Introduction:
   - Format title as: <h1 class="text-center mb-8">${title}</h1>
   - Write a compelling introduction (250-300 words) that:
     • Must be split into THREE distinct paragraphs
     • Use TWO blank lines between paragraphs
     • Include 2-3 relevant emojis naturally in the text
     • First paragraph: Hook the reader (75-100 words)
     • Second paragraph: Explain the gift context (75-100 words)
     • Third paragraph: Preview the recommendations (75-100 words)

2. Product Sections (EXACTLY ${numItems} items):
   ${demographicContext}
   - Each product MUST be from a different category
   - Each section separated by: <hr class="my-8">
   - Format product titles as: <h3>[BRAND] [PRODUCT NAME]</h3>
   - Keep product names SHORT (max 7 words)
   - Ensure products are available on Amazon

3. Content Structure:
   - Write 2-3 engaging paragraphs for each product
   - Start paragraphs with: 🎁 ⭐ 💝
   - Include 3 key features as bullet points
   - Format features as:
     <ul class="my-4">
       <li>✅ [Feature 1]</li>
       <li>✅ [Feature 2]</li>
       <li>✅ [Feature 3]</li>
     </ul>

4. Conclusion:
   - Add <hr class="my-8"> before conclusion
   - Write 150-word summary
   - End with <hr class="my-8">

5. Related Posts Section:
   - Add heading: <h3>Related Gift Ideas</h3>
   - Add text: "Looking for more gift ideas? Check out these helpful guides:"
   - Add list format:
     <ul class="my-4">
       <li>🎁 [LINK 1 PLACEHOLDER]</li>
       <li>🎁 [LINK 2 PLACEHOLDER]</li>
       <li>🎁 [LINK 3 PLACEHOLDER]</li>
     </ul>
   - Add button:
     <div class="flex justify-center mt-12 mb-8">
       <a href="/" class="perfect-gift-button">Get the Perfect Gift</a>
     </div>

CRITICAL: Ensure EXACTLY ${numItems} product recommendations, each from a different category.`
          },
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await response.json();
    const initialContent = openaiData.choices[0].message.content;

    // Process the content to add Amazon product information
    const { content, affiliateLinks } = await processContent(
      initialContent,
      amazonAssociateId,
      rapidApiKey
    );

    return new Response(
      JSON.stringify({ content, affiliateLinks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'generate-blog-post-error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});