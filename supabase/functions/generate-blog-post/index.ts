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

    // Extract number of products from title
    const numberMatch = title.match(/(?:top\s+)?(\d+)\s+(?:best\s+)?/i);
    const numberOfProducts = numberMatch ? parseInt(numberMatch[1]) : 8;
    console.log('Number of products to generate:', numberOfProducts);

    // Get the prompt from promptBuilder
    const prompt = buildBlogPrompt(title);
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    // Generate content in chunks
    const generateChunk = async (startIndex: number, endIndex: number) => {
      console.log(`Generating products ${startIndex + 1} to ${endIndex}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            prompt,
            {
              role: "user",
              content: `Generate products ${startIndex + 1} to ${endIndex} for: ${title}. 
                       Follow EXACTLY the format specified in the system message.
                       Generate EXACTLY ${endIndex - startIndex} products.`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
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
      return data.choices[0].message.content;
    };

    // Generate content in chunks of 3 products
    const CHUNK_SIZE = 3;
    const contentChunks = [];
    
    for (let i = 0; i < numberOfProducts; i += CHUNK_SIZE) {
      const endIndex = Math.min(i + CHUNK_SIZE, numberOfProducts);
      const chunk = await generateChunk(i, endIndex);
      contentChunks.push(chunk);
    }

    // Combine chunks
    const introduction = contentChunks[0].split('<hr class="my-8">')[0];
    const productSections = contentChunks.flatMap(chunk => {
      const sections = chunk.split('<hr class="my-8">');
      return sections.slice(sections[0].includes('<h1') ? 1 : 0);
    });

    const combinedContent = [
      introduction,
      ...productSections
    ].join('<hr class="my-8">');

    console.log('Combined content length:', combinedContent.length);

    // Validate the combined content
    if (!validateContent(combinedContent, title)) {
      console.error('Generated content validation failed');
      throw new Error('Generated content does not match required format or product count');
    }

    // Process the content to add Amazon product data
    console.log('Processing content with Amazon data...');
    const processedData = await processContent(
      combinedContent.replace(/```html\n?|\n?```/g, ''),
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