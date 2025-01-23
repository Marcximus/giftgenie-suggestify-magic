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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Updated to use the correct model name
        messages: [
          prompt,
          {
            role: "user",
            content: `Create a fun, engaging blog post about: ${title}\n\n${demographicContext}\n\nIMPORTANT: You MUST generate EXACTLY 10 product recommendations, no more, no less.`
          }
        ],
        temperature: 0.7,
        max_tokens: 3500,
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
    console.log('OpenAI response received, processing content...');

    const initialContent = openaiData.choices[0].message.content;
    console.log('Generated content length:', initialContent.length);

    // Validate content including word count
    const validation = validateBlogContent(initialContent);
    console.log('Content validation result:', validation);

    if (!validation.isValid) {
      console.warn('Content validation failed:', validation.errors);
      throw new Error(`Content validation failed: ${validation.errors.join(', ')}`);
    }

    // Update the blog post with word count
    const processedContent = {
      ...initialContent,
      word_count: validation.wordCount
    };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the processed content in the database
    const { error: dbError } = await supabase
      .from('blog_posts')
      .insert([{ content: processedContent, title }]);

    if (dbError) {
      console.error('Error saving blog post to database:', dbError);
      throw new Error('Failed to save blog post');
    }

    return new Response(
      JSON.stringify({ message: 'Blog post created successfully' }),
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
