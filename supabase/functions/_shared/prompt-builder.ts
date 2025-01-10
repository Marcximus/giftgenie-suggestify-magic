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

  enhancedPrompt += `
  Key Requirements:
  1. Budget: Between $${minBudget} and $${maxBudget}
  2. Gift Categories:
     - Premium quality items from reputable brands
     - Unique or limited edition products
     - Experience-based gifts
     - Luxury accessories or gadgets
     - High-end hobby equipment
     - Collector's items
     - Innovative tech products
     - Personalized luxury items

  3. Quality Guidelines:
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