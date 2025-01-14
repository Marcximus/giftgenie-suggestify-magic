interface PromptConfig {
  hasEverything: boolean;
  isMale: boolean;
  isFemale: boolean;
  minBudget: number;
  maxBudget: number;
  ageCategory?: string | null;
  occasion?: string;
}

export function buildGiftPrompt(prompt: string, config: PromptConfig): string {
  const { hasEverything, isMale, isFemale, minBudget, maxBudget, ageCategory, occasion } = config;
  const budgetContext = `with a budget between $${minBudget} and $${maxBudget}`;

  let enhancedPrompt = `As a luxury gift expert, suggest 3-4 thoughtful and specific gift ideas ${budgetContext} `;
  
  if (hasEverything) {
    enhancedPrompt += `for someone who seemingly has everything. Focus on:
    - Unique experiences and services
    - Limited edition or customizable items
    - Innovative new products they might not know about
    - Luxury versions of everyday items
    - Experiential gifts that create memories
    - Personalized or bespoke items\n\n`;
  }

  // Add age-specific instructions based on category
  switch (ageCategory) {
    case 'infant':
      enhancedPrompt += `
      CRITICAL: These suggestions are for an infant (0-2 years). Ensure all items are:
      - Safe and age-appropriate for babies
      - Developmentally stimulating
      - Free from small parts or choking hazards
      - Easy to clean and maintain
      - Durable and high-quality
      - Supporting motor skills development\n`;
      break;

    case 'child':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a child. Focus on:
      - Age-appropriate and safe items
      - Educational and developmental value
      - Fun and engaging activities
      - Creative expression tools
      - STEM learning opportunities\n`;
      break;

    case 'teen':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a teenager. Focus on:
      - Current trends and popular culture
      - Technology and gadgets
      - Creative expression items
      - Identity and personality development
      - Learning and skill development\n`;
      break;

    case 'youngAdult':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a young adult. Consider:
      - Career and professional development
      - First home/apartment essentials
      - Modern technology and gadgets
      - Personal growth items
      - Lifestyle and wellness products\n`;
      break;

    case 'adult':
      enhancedPrompt += `
      CRITICAL: These suggestions are for an adult. Focus on:
      - Sophisticated and refined items
      - Quality over novelty
      - Professional and career enhancement
      - Home and lifestyle improvement
      - Wellness and self-care\n`;
      break;

    case 'senior':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a senior (65+). Focus on:
      - Comfort and accessibility
      - Memory and legacy items
      - Easy-to-use technology
      - Health and wellness products
      - Social connection tools\n`;
      break;
  }

  // Add gender-specific instructions
  if (isMale) {
    enhancedPrompt += `CRITICAL: Ensure all suggestions are specifically appropriate for male recipients.\n`;
  } else if (isFemale) {
    enhancedPrompt += `CRITICAL: Ensure all suggestions are specifically appropriate for female recipients.\n`;
  }

  // Add occasion-specific context if provided
  if (occasion) {
    enhancedPrompt += `CRITICAL: These suggestions are for ${occasion}. Ensure gifts are appropriate for this occasion.\n`;
  }

  // Extract any specific interests from the prompt
  const interestMatch = prompt.toLowerCase().match(/(?:likes?|loves?|enjoys?|into)\s+([^.,!?]+)/i);
  const specificInterest = interestMatch ? interestMatch[1].trim() : null;

  enhancedPrompt += `
  CRITICAL REQUIREMENTS:
  1. Budget: Strictly between $${minBudget} and $${maxBudget}
  ${specificInterest ? `2. Include 2 suggestions that directly relate to their interest in ${specificInterest}` : ''}
  
  Format Guidelines:
  - Include specific brand names and model numbers
  - Use complete product names (e.g., "Sony WH-1000XM4 Wireless Noise Cancelling Headphones" instead of just "headphones")
  - Include premium or special editions when available
  - Ensure items are currently available on Amazon
  - Avoid generic descriptions
  ${isMale || isFemale ? `- Ensure gender-appropriate suggestions` : ''}

  Format each suggestion as:
  "Brand Name Specific Product Model (Premium/Special Edition) - [Category] Version"

  Return ONLY a JSON array of 3-4 specific gift suggestions.`;

  return enhancedPrompt;
}