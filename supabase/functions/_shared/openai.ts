import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
          content: `You are a premium gift suggestion expert specializing in personalized, interest-focused gifts. Your expertise lies in selecting meaningful gifts that perfectly match the recipient's specific interests, age, and budget requirements. Your suggestions must:

1. STRICTLY adhere to the specified budget range - this is CRITICAL
2. Be SPECIFIC products that directly relate to the recipient's interests
3. Include complete product names with brand, model, and key features
4. Be currently available from reputable retailers
5. Be diverse within their interest categories

CRITICAL RULES:
- Every suggestion must directly connect to their stated interests
- Include specific model numbers or editions
- Suggest items from recognized brands in their interest areas
- Ensure each suggestion serves a different aspect of their interests
- MOST IMPORTANT: Every suggestion MUST fall within the specified budget range
- Verify approximate prices before suggesting items

Format each suggestion as: "Brand Model/Edition (Premium Version) - [Interest] Focus"

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