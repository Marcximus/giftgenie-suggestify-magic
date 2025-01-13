interface PromptConfig {
  hasEverything: boolean;
  isMale: boolean;
  minBudget: number;
  maxBudget: number;
}

export function buildGiftPrompt(prompt: string, config: PromptConfig): string {
  const { hasEverything, isMale, minBudget, maxBudget } = config;

  let enhancedPrompt = `As a luxury gift expert, suggest 8 thoughtful and unique gift ideas `;
  
  if (hasEverything) {
    enhancedPrompt += `for someone who seemingly has everything. Focus on:
    - Unique experiences and services
    - Limited edition or customizable items
    - Innovative new products they might not know about
    - Luxury versions of everyday items
    - Experiential gifts that create memories
    - Personalized or bespoke items
    - Collector's editions or rare finds
    - Items that combine multiple interests\n\n`;
  }

  if (isMale) {
    enhancedPrompt += `CRITICAL: Ensure all suggestions are specifically appropriate for male recipients.\n`;
  }

  // Extract any specific interests from the prompt
  const interestMatch = prompt.toLowerCase().match(/(?:likes?|loves?|enjoys?|into)\s+([^.,!?]+)/i);
  const specificInterest = interestMatch ? interestMatch[1].trim() : null;

  enhancedPrompt += `
  CRITICAL REQUIREMENTS:
  1. Budget: Between $${minBudget} and $${maxBudget}
  ${specificInterest ? `2. IMPORTANT: Include 3-4 suggestions that directly relate to their interest in ${specificInterest}, but distribute them randomly throughout the list of suggestions` : ''}
  
  Gift Categories Distribution:
  ${specificInterest ? 
    `- Mix interest-specific gifts (${specificInterest}) randomly with general suggestions
     - Do not group interest-specific gifts together
     - Ensure a natural flow between specific and general suggestions` :
    '- Distribute suggestions across various categories'}

  Quality Guidelines:
  - Focus on premium brands and materials
  - Include specific model numbers or editions
  - Emphasize uniqueness and exclusivity
  - Consider items that enhance lifestyle
  - Include at least one experience-based gift
  - Suggest items that show thoughtfulness

  Format each suggestion as:
  "Brand Name Specific Product (Premium/Special Edition) - [Category] Version"

  IMPORTANT: Each suggestion must be:
  - Actually available for purchase
  - Within the specified budget range
  - Specific and detailed enough to find online
  - Unique and memorable`;

  return enhancedPrompt;
}