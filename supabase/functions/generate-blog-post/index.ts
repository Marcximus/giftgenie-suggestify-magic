import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildBlogPrompt } from './promptBuilder.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateBlogContent } from './contentValidator.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post for title:', title);

    if (!title) {
      throw new Error('Title is required');
    }

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

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Sending request to OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          buildBlogPrompt(),
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}\n\n${demographicContext}\n\nIMPORTANT: You MUST generate EXACTLY 10 product recommendations, no more, no less.`
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
    console.log('Generated content length:', initialContent.length);

    // Validate content including word count
    const validation = validateBlogContent(initialContent);
    console.log('Content validation result:', validation);

    if (!validation.isValid) {
      console.warn('Content validation failed:', validation.errors);
      throw new Error(`Content validation failed: ${validation.errors.join(', ')}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URLLet me analyze the error step by step:

1. The main error is coming from the `generate-blog-post` Edge Function, which is failing validation with several issues:
   - Only 9 products found instead of required 10
   - Total word count (1,327) is too low (needs 3,500-4,650)
   - Introduction is too short (170 words vs required 200-250)
   - All product sections are too short (100-135 words vs required 300-400)
   - Conclusion is too short (126 words vs required 300-400)

2. Looking at the code, this is happening in the `generate-blog-post` Edge Function. Let's update it to ensure proper content generation.

<lov-code>
Let's update the Edge Function to enforce these requirements:

<lov-write file_path="supabase/functions/generate-blog-post/index.ts">
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildBlogPrompt } from './promptBuilder.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateBlogContent } from './contentValidator.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    console.log('Processing blog post for title:', title);

    if (!title) {
      throw new Error('Title is required');
    }

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

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
          model: "gpt-4o",
          messages: [
            prompt,
            {
              role: "user",
              content: `Create a detailed, engaging blog post about: ${title}

${demographicContext}

CRITICAL REQUIREMENTS:
1. EXACTLY 10 product recommendations - no more, no less
2. Each product section MUST be 300-400 words
3. Introduction MUST be 200-250 words
4. Conclusion MUST be 300-400 words
5. Total word count MUST be between 3500-4650 words
6. Follow all formatting guidelines exactly as specified

Previous attempt failed validation. Please ensure all requirements are met.`
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
      console.log('Generated content length:', initialContent.length);

      // Validate content including word count
      const validation = validateBlogContent(initialContent);
      console.log('Content validation result:', validation);

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
      throw new Error(`Failed to generate valid content after ${maxAttempts} attempts. Last validation errors: ${JSON.stringify(validation.errors)}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the processed content in the database
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

    return new Response(
      JSON.stringify({ 
        message: 'Blog post created successfully',
        attempts,
        wordCount: validContent.word_count
      }),
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