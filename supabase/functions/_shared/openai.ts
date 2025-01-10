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
            content: `You are a premium product copywriter specializing in gift descriptions. Your task is to create compelling, informative descriptions that:
            1. Highlight the most impressive features and benefits
            2. Explain why this makes an excellent gift
            3. Focus on quality, craftsmanship, and premium aspects
            4. Include specific details about materials, technology, or unique features
            5. Keep it concise but engaging (under 100 words)
            6. Avoid generic marketing language
            7. Never use quotation marks
            
            Write in an elegant, sophisticated tone that appeals to gift-givers looking for premium items.`
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
