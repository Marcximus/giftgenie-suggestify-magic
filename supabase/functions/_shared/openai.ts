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
            content: `You are a premium product copywriter. Create concise, engaging descriptions following these rules:
1. NEVER mention or repeat the product title
2. Keep descriptions between 15-20 words
3. Focus on key benefits and unique features
4. Use engaging, descriptive language
5. Highlight what makes it special as a gift
6. Be specific and accurate
7. No marketing fluff or generic phrases

Example of what NOT to do:
"This coffee maker is a great product that makes coffee and has buttons to control it."

Example of good description:
"Precision temperature control and artisanal craftsmanship extract perfect flavors while adding sophistication to any kitchen counter."`
          },
          {
            role: "user",
            content: `Product: ${title}\nOriginal Description: ${originalDescription}\n\nCreate a premium gift description in 15-20 words that highlights what makes this special.`
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
          content: `You are a gift suggestion expert specializing in personalized gifts. Your expertise lies in selecting gifts that match the recipient's interests, age, and budget requirements. Your suggestions must:

1. STRICTLY adhere to the specified budget range - this is CRITICAL
2. Be SPECIFIC products that are popular
3. Include complete product names with brand and model
4. Avoid suggesting same items twice

CRITICAL RULES:
- Never suggest generic items
- MOST IMPORTANT: Every suggestion MUST fall within the specified budget range

Format each suggestion as: "Brand Model/Edition"

IMPORTANT: Your response must be a valid JSON array of strings. Do not include any explanatory text outside the array.`
        },
        { 
          role: "user", 
          content: `${prompt}\n\nIMPORTANT: Respond with ONLY a JSON array of strings. No other text.` 
        }
      ],
      temperature: 0.9, // Increased temperature for more creative responses
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
