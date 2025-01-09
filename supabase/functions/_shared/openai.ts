const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export async function generateCustomDescription(title: string, originalDescription: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a luxury gift expert specializing in premium products. Generate an engaging and concise product description that highlights the premium features and brand value that make this an impressive gift. Keep it under 100 words. Do not use quotation marks in your response."
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nGenerate a premium gift-focused description without quotation marks.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return originalDescription;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.replace(/['"]/g, '') || originalDescription;
  } catch (error) {
    console.error('Error generating custom description:', error);
    return originalDescription;
  }
}

export async function generateGiftSuggestions(prompt: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a gift suggestion expert specializing in thoughtful, high-quality gifts. Your expertise lies in selecting meaningful gifts that match the recipient's interests and budget perfectly. Your suggestions must:

1. Be SPECIFIC products from well-known, quality brands
2. STRICTLY stay within the specified budget range - this is critical
3. Be currently available from reputable retailers
4. Perfectly match the recipient's interests and preferences
5. Include complete product names with brand, model, and key feature
6. Be diverse within the category (avoid suggesting multiple similar items)

CRITICAL RULES:
- Never suggest generic items (e.g., "golf clubs" → "Titleist TSi3 Driver with HZRDUS Smoke RDX 60 Shaft")
- Include specific model numbers or editions when relevant
- Suggest items from recognized brands
- Ensure each suggestion is unique and serves a different purpose
- IMPORTANT: Spread suggestions across the entire specified budget range
- Make sure every suggestion fits within the budget - no exceptions

Format each suggestion as: "Brand Model/Edition with Key Feature"
Example: "Sony WH-1000XM5 Noise Cancelling Headphones with LDAC"

Remember: Focus on relevance and quality. Each suggestion should be thoughtful and match both interests and budget.`
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.9,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(
    data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim()
  );
}