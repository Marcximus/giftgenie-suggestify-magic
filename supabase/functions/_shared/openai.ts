import { OPENAI_API_KEY } from './config.ts';

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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a gift suggestion expert. Generate specific, purchasable gift ideas that match the given criteria.

Guidelines:
- Suggest real, available products
- Include brand names when relevant
- Match any specified budget, age, or interests
- Keep suggestions practical and purchasable
- Format: "Product Name by Brand" or "Brand Product Name"

Example response format:
["Apple AirPods Pro", "Nike Air Zoom Pegasus 38", "Kindle Paperwhite"]`
          },
          { 
            role: "user", 
            content: `${prompt}\n\nProvide 8 specific gift suggestions as a JSON array of strings.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    try {
      const content = data.choices[0].message.content.trim();
      console.log('Parsed content:', content);
      
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