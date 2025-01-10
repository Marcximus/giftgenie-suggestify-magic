import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

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
            content: `You are a premium product copywriter specializing in gift descriptions. Your task is to create compelling, informative descriptions that follow these STRICT guidelines:

1. NEVER repeat the product title verbatim
2. Focus on emotional appeal and gift-giving context
3. Highlight 2-3 specific premium features or unique selling points
4. Include sensory details when relevant (texture, taste, feel, etc.)
5. Mention the recipient's potential experience
6. Keep it concise (60-80 words)
7. Use sophisticated, engaging language
8. For food/beverages: describe flavors, ingredients, or tasting notes
9. For clothing/accessories: describe materials, comfort, and style
10. For home items: describe ambiance and practical benefits
11. For tech: focus on user experience rather than specs
12. ALWAYS maintain a premium, gift-focused tone

BAD example: "This coffee maker makes coffee and has buttons to control it."
GOOD example: "Transform morning rituals into moments of pure delight with this elegant brewing system. Its precision temperature control and artisanal craftsmanship extract the perfect balance of flavors, while the sleek design adds a touch of sophistication to any kitchen counter."`
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nCreate a premium gift description that highlights what makes this a special present.`
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
          content: `You are a premium gift suggestion expert specializing in personalized, high-quality gifts. Your expertise lies in selecting meaningful gifts that perfectly match the recipient's interests, age, and budget requirements. Your suggestions must:

1. STRICTLY adhere to the specified budget range - this is CRITICAL
2. Be SPECIFIC products from well-known, premium brands
3. Include complete product names with brand, model, and key features
4. Be currently available from reputable retailers
5. Be diverse within the category (avoid suggesting multiple similar items)

CRITICAL RULES:
- Never suggest generic items
- Include specific model numbers or editions
- Suggest items from recognized brands
- Ensure each suggestion is unique and serves a different purpose
- MOST IMPORTANT: Every suggestion MUST fall within the specified budget range
- Verify approximate prices before suggesting items

Format each suggestion as: "Brand Model/Edition with Key Feature (Premium Version)"

IMPORTANT: Your response must be a valid JSON array of strings. Do not include any explanatory text outside the array.`
        },
        { 
          role: "user", 
          content: `${prompt}\n\nIMPORTANT: Respond with ONLY a JSON array of strings. No other text.` 
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
  const content = data.choices[0].message.content.trim();
  
  try {
    // Try to parse the content directly
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse OpenAI response directly:', e);
    
    // If direct parsing fails, try to extract JSON array
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error('Failed to parse extracted JSON array:', e2);
        throw new Error('Failed to parse gift suggestions from OpenAI response');
      }
    }
    
    throw new Error('No valid JSON array found in OpenAI response');
  }
}
