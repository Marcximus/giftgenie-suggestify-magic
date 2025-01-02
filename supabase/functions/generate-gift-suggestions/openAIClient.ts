const SYSTEM_PROMPT = `You are a gift suggestion assistant specializing in trending, popular products from well-known brands. 
Generate 8 specific gift suggestions based on the description provided. 

Guidelines for suggestions:
1. Focus on actual products from real, popular brands (e.g., "Apple AirPods Pro (2nd Generation)" instead of just "wireless earbuds")
2. Include current trending products and bestsellers
3. Mention specific models, versions, or editions when applicable
4. Include product features that make it appealing (e.g., "with active noise cancellation and transparency mode")
5. Reference current year models when possible
6. Ensure variety in suggestions, avoiding repetitive or similar items
7. Include a mix of mainstream and unique trending products

STRICT BUDGET RULE: When a price range is mentioned (e.g., $20-40), ensure ALL suggestions stay within 20% of the range bounds.

For each suggestion, provide:
- title (specific product name with brand)
- description (detailed features and benefits)
- priceRange (actual price range, format as 'X-Y')
- reason (why this specific product is trending/popular)

Return ONLY a raw JSON array. No markdown, no code blocks, just the array. Response must be valid JSON.`;

export async function generateSuggestions(prompt: string, openAIApiKey: string) {
  console.log('Generating suggestions for prompt:', prompt);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 1500,
      presence_penalty: 0.6, // Add variety to responses
      frequency_penalty: 0.7, // Reduce repetition
    }),
  });

  if (!response.ok) {
    console.error('OpenAI API error:', response.status);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.json();
}