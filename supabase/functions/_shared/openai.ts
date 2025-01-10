import { OPENAI_API_KEY } from './config.ts';

export async function generateCustomDescription(
  title: string,
  originalDescription: string
): Promise<string> {
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating custom description:', error);
    return originalDescription;
  }
}

export async function generateGiftSuggestions(prompt: string): Promise<string[]> {
  console.log('Generating suggestions with prompt:', prompt);
  
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
            content: `You are a gift suggestion expert. Your expertise lies in selecting gifts that match the recipient's interests, gender, age, and budget requirements. Your suggestions should:

1. adhere to the specified budget range 
2. Be SPECIFIC, popular products 
3. Include complete product names with brand and model
4. Avoid suggesting same items twice

Format each suggestion as: "Brand Model/Edition"

IMPORTANT: Your response must be a valid JSON array of strings. Do not include any explanatory text outside the array.`
          },
          { 
            role: "user", 
            content: `${prompt}\n\nIMPORTANT: Respond with ONLY a JSON array of strings. No other text.` 
          }
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const content = data.choices[0].message.content.trim();
    console.log('Parsed content:', content);
    
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
  } catch (error) {
    console.error('Error in generateGiftSuggestions:', error);
    throw error;
  }
}