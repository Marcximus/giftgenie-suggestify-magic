import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
            content: `You are a gift suggestion expert. Analyze the recipient's interests, age, gender, and occasion to suggest specific, thoughtful gifts. 
              For each suggestion:
              - Be specific (e.g., "Sony WH-1000XM4 Wireless Headphones" instead of just "headphones")
              - Consider the recipient's interests and lifestyle
              - Include a mix of practical and creative gifts
              - Consider the occasion appropriateness
              - Stay within any specified budget
              - Ensure gender appropriateness
              
              Return ONLY a JSON array of 8 specific gift keywords in this format: ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5", "suggestion6", "suggestion7", "suggestion8"]
              Each suggestion should be searchable on Amazon.
              
              IMPORTANT: Your response must be a valid JSON array containing exactly 8 strings. Do not include any additional text or formatting.`
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
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    try {
      // Try to parse the content directly
      const suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions) || suggestions.length !== 8) {
        throw new Error('Invalid response format: expected array of 8 suggestions');
      }
      
      if (!suggestions.every(item => typeof item === 'string')) {
        throw new Error('Invalid response format: all items must be strings');
      }
      
      return suggestions;
      
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      
      // Try to extract JSON array if direct parsing fails
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const suggestions = JSON.parse(match[0]);
          if (Array.isArray(suggestions) && suggestions.length === 8) {
            return suggestions;
          }
        } catch (e2) {
          console.error('Failed to parse extracted JSON array:', e2);
        }
      }
      
      throw new Error('Failed to parse gift suggestions from OpenAI response');
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}