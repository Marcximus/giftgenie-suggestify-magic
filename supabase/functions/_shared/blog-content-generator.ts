import { ChatCompletionMessage } from "./types.ts";

export async function generateBlogContent(title: string, maxPrice: number, numProducts: number, subject: string) {
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
          content: `You are a professional gift blog writer specializing in creating engaging, detailed content. Follow these guidelines:

1. Write in a fun, conversational tone with personality
2. Use HTML formatting (h2, h3, p tags)
3. Include relevant emojis in ALL section headings
4. Create detailed sections:
   - Engaging introduction (2-3 paragraphs)
   - Why these gifts are perfect (2-3 paragraphs)
   - Each product recommendation (3-4 paragraphs per item)
   - Tips for choosing the right gift
   - Conclusion with call-to-action
5. For each product recommendation:
   - Use [PRODUCT_PLACEHOLDER] tag BEFORE each product heading
   - Make product titles VERY specific with brand names and models
   - Explain why it's a great gift
   - Describe key features and benefits
   - Share potential scenarios where it would be perfect
   - Include personal anecdotes or examples
6. Use bullet points and numbered lists where appropriate
7. Format prices as USD
8. Ensure proper HTML formatting
9. STRICTLY follow price limits mentioned in title
10. Make content fun and engaging with:
    - Personal stories
    - Humor and wit
    - Practical examples
    - Relatable scenarios
11. Minimum length: 1500 words
12. Make product titles VERY specific with brand names and models for accurate Amazon matching`
        },
        {
          role: "user",
          content: `Write a detailed blog post with the title: "${title}". 
          Requirements:
          1. STRICTLY follow the criteria in the title (price range, number of items)
          2. Each product recommendation should be specific and detailed
          3. Include [PRODUCT_PLACEHOLDER] tag BEFORE each product heading
          4. Format with proper HTML tags
          5. Include emojis in ALL section headings
          6. Keep all recommendations under $${maxPrice}
          7. Include exactly ${numProducts} product recommendations
          8. Focus specifically on ${subject}
          9. Make it fun and engaging
          10. Minimum 1500 words
          11. Include specific brand names and model numbers in product titles`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate blog post content');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}