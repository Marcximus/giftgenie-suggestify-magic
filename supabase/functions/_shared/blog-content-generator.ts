import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

export async function generateBlogContent(title: string, maxPrice: number, numProducts: number, subject: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional blog content writer specializing in gift recommendations. Create engaging, SEO-optimized content that follows this structure:

1. Skip the title (it will be added separately)
2. Start with an engaging introduction
3. Include these sections:
   - Why these gifts are perfect for the occasion
   - Tips for choosing the right gift
   - Product recommendations (${numProducts} items under $${maxPrice})
   - Conclusion with call-to-action
5. For each product recommendation:
   - Use [PRODUCT_PLACEHOLDER] tag BEFORE each product heading
   - Make product titles VERY specific with brand names and models
   - Explain why it's a great gift
   - Describe key features and benefits
   - Share potential scenarios where it would be perfect
6. Format content with:
   - Clear headings (H2, H3)
   - Short, readable paragraphs
   - Bullet points where appropriate
7. Use emojis sparingly for visual appeal
8. Maintain a friendly, conversational tone
9. Include relevant keywords naturally
10. Add depth with:
    - Expert insights
    - Practical examples
    - Relatable scenarios
11. Minimum length: 1500 words
12. Make product titles VERY specific with brand names and models for accurate Amazon matching`
          },
          {
            role: "user",
            content: `Create a blog post about: ${title}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error('Failed to generate blog content');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating blog content:', error);
    throw error;
  }
}