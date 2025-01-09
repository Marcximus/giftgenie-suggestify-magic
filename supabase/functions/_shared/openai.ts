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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a gift suggestion expert. Generate an engaging and concise product description that highlights why this would make a great gift. Keep it under 100 words. Do not use quotation marks in your response."
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nGenerate a gift-focused description without quotation marks.`
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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a gift suggestion expert. Your task is to generate SPECIFIC gift suggestions that:
          1. STRICTLY match the provided budget range
          2. Are available on Amazon.com
          3. Are highly relevant to the recipient's interests and age
          4. Include only the product name, no descriptions or explanations
          5. Are specific products (e.g., "Sony WH-1000XM4 Headphones" instead of just "headphones")
          
          Format rules:
          - Return EXACTLY 8 specific product names
          - Format as a JSON array of strings
          - Do not include prices in the product names
          - Do not include generic descriptions
          - Focus on real, purchasable products
          
          Example format: ["Sony WH-1000XM4 Headphones", "Kindle Paperwhite 2023", "Nintendo Switch OLED"]
          
          Remember: STRICTLY adhere to the budget range provided in the prompt!`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
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