import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export async function generateCustomDescription(title: string, originalDescription: string): Promise<string> {
  try {
    console.log('Generating custom description for:', title);
    
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
            content: `You are a product description expert. Create compelling, informative descriptions that:

1. Focus on the key benefits and features that make this item special
2. Explain why it makes a great gift
3. Use clear, direct language
4. Keep descriptions between 20-30 words
5. Include specific details about functionality or unique features
6. Never mention brand names or product titles
7. Avoid marketing clichés and generic phrases

Example of a good description:
"Delivers crystal-clear sound with deep bass and noise cancellation, perfect for immersive music experiences during workouts or daily commutes."

Example of what to avoid:
"This amazing product has great features and will make anyone happy."

Remember to be specific about what makes this item valuable as a gift.`
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nCreate a clear, specific description that highlights the key benefits and features that make this a great gift.`
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return originalDescription;
    }

    const data = await response.json();
    const generatedDescription = data.choices?.[0]?.message?.content?.replace(/['"]/g, '') || originalDescription;
    console.log('Generated description:', generatedDescription);
    return generatedDescription;
  } catch (error) {
    console.error('Error generating custom description:', error);
    return originalDescription;
  }
}