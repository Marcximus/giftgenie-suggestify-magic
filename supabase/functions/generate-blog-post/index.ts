import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildBlogPrompt } from './promptBuilder.ts';
import { validateBlogContent } from './contentValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

console.log("Edge Function: generate-blog-post initialized");

serve(async (req) => {
  // Log request details
  console.log(`Received ${req.method} request from origin:`, req.headers.get("origin"));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders
    });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post for title:', title);

    if (!title) {
      throw new Error('Title is required');
    }

    // Initialize Supabase client early to catch any initialization errors
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect demographic information
    const titleLower = title.toLowerCase();
    const isTeenage = titleLower.includes('teen') || titleLower.includes('teenage');
    const isFemale = titleLower.includes('sister') || titleLower.includes('girl') || titleLower.includes('daughter');
    
    // Build demographic-specific prompt
    const demographicContext = isTeenage && isFemale ? `
      CRITICAL: These suggestions are specifically for a teenage girl. Consider:
      - Current teen trends and interests (TikTok, Instagram, etc.)
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

    // Get the prompt from promptBuilder
    const prompt = buildBlogPrompt();
    console.log('Using prompt system content:', prompt.content.substring(0, 200) + '...');

    let attempts = 0;
    const maxAttempts = 3;
    let validContent = null;

    while (attempts < maxAttempts && !validContent) {
      attempts++;
      console.log(`Attempt ${attempts} to generate content...`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            prompt,
            {
              role: "user",
              content: `Create a detailed, engaging blog post about: ${title}\n${demographicContext}`
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const openaiData = await response.json();
      console.log('OpenAI response received, validating content...');

      const initialContent = openaiData.choices[0].message.content;
      const validation = validateBlogContent(initialContent);
      
      if (validation.isValid) {
        validContent = {
          content: initialContent,
          word_count: validation.wordCount
        };
        break;
      } else {
        console.warn(`Validation failed on attempt ${attempts}:`, validation.errors);
      }
    }

    if (!validContent) {
      throw new Error(`Failed to generate valid content after ${maxAttempts} attempts`);
    }

    // Store the processed content
    const { error: dbError } = await supabase
      .from('blog_posts')
      .insert([{ 
        content: validContent.content, 
        title,
        word_count: validContent.word_count,
        generation_attempts: attempts
      }]);

    if (dbError) {
      console.error('Error saving blog post to database:', dbError);
      throw new Error('Failed to save blog post');
    }

    console.log('Successfully generated and saved blog post');

    return new Response(
      JSON.stringify({ 
        message: 'Blog post created successfully',
        attempts,
        wordCount: validContent.word_count
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
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
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
