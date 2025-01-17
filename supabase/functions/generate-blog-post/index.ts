import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildBlogPrompt } from "./promptBuilder.ts";
import { processContent } from "../_shared/content-processor.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { validateContent } from "./contentValidator.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post for title:', title);

    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');

    if (!openaiKey || !rapidApiKey || !associateId) {
      throw new Error('Required environment variables are missing');
    }

    // Get the prompt from promptBuilder - this is the ONLY prompt we use
    const prompt = buildBlogPrompt(title);
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    // Make the OpenAI API call with increased max_tokens
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          prompt, // Use ONLY the prompt from promptBuilder
          {
            role: "user",
            content: `Generate a detailed blog post about: ${title}. 
                     Follow EXACTLY the format specified in the system message.
                     Do not deviate from the required structure.
                     Include all HTML tags and formatting exactly as specified.
                     IMPORTANT: Generate exactly the number of products specified in the title.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, processing content...');

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content length:', generatedContent.length);
    console.log('Generated content preview:', generatedContent.substring(0, 500));

    // Validate content structure and number of products
    if (!validateContent(generatedContent, title)) {
      console.error('Generated content validation failed');
      throw new Error('Generated content does not match required format or product count');
    }

    // Process the content to add Amazon product data
    console.log('Processing content with Amazon data...');
    const processedData = await processContent(
      generatedContent.replace(/```html\n?|\n?```/g, ''),
      associateId,
      rapidApiKey
    );

    console.log('Content processing complete:', {
      contentLength: processedData.content.length,
      affiliateLinksCount: processedData.affiliateLinks.length,
      hasReviews: processedData.productReviews?.length > 0
    });

    return new Response(
      JSON.stringify(processedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post:', error);
    
    // If we get a token limit error, try splitting the generation
    if (error.message?.includes('maximum context length')) {
      console.log('Token limit reached, consider implementing batch processing');
    }
    
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'generate-blog-post-error',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});