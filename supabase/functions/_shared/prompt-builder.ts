interface PromptConfig {
  hasEverything: boolean;
  isMale: boolean;
  isFemale: boolean;
  minBudget: number;
  maxBudget: number;
}

export function buildGiftPrompt(prompt: string, config: PromptConfig): string {
  const { hasEverything, isMale, isFemale, minBudget, maxBudget } = config;
  const analysis = analyzePrompt(prompt);

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

  // Add age-specific instructions based on category
  switch (analysis.ageCategory) {
    case 'infant':
      enhancedPrompt += `
      CRITICAL: These suggestions are for an infant (0-2 years). Ensure all items are:
      - Safe and age-appropriate for babies
      - Developmentally stimulating
      - Free from small parts or choking hazards
      - Easy to clean and maintain
      - Durable and high-quality
      - Supporting motor skills development
      - Engaging sensory experiences
      - Parent-approved and trusted brands\n`;
      break;

    case 'child':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a child. Focus on:
      - Age-appropriate and safe items
      - Educational and developmental value
      - Fun and engaging activities
      - Creative expression tools
      - Social skill development
      - Physical activity promotion
      - STEM learning opportunities
      - Imaginative play items\n`;
      break;

    case 'teen':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a teenager. Focus on:
      - Current trends and popular culture
      - Technology and gadgets
      - Social connection tools
      - Creative expression items
      - Identity and personality development
      - Independence-promoting items
      - Learning and skill development
      - Entertainment and gaming\n`;
      break;

    case 'youngAdult':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a young adult. Consider:
      - Career and professional development
      - First home/apartment essentials
      - Modern technology and gadgets
      - Social and experiential gifts
      - Personal growth items
      - Lifestyle and wellness products
      - Practical luxury items
      - Travel and adventure gear\n`;
      break;

    case 'adult':
      enhancedPrompt += `
      CRITICAL: These suggestions are for an adult. Focus on:
      - Sophisticated and refined items
      - Quality over novelty
      - Professional and career enhancement
      - Home and lifestyle improvement
      - Wellness and self-care
      - Hobby and interest development
      - Time-saving solutions
      - Premium experiences\n`;
      break;

    case 'senior':
      enhancedPrompt += `
      CRITICAL: These suggestions are for a senior (65+). Focus on:
      - Comfort and accessibility
      - Memory and legacy items
      - Easy-to-use technology
      - Health and wellness products
      - Social connection tools
      - Hobby enhancement
      - Nostalgic elements
      - Safety and convenience features
      - Quality leisure activities
      - Thoughtful practical items\n`;
      break;
  }

  // Add gender-specific instructions
  if (isMale) {
    enhancedPrompt += `CRITICAL: Ensure all suggestions are specifically appropriate for male recipients. Focus on men's sizes, styles, and preferences.\n`;
  } else if (isFemale) {
    enhancedPrompt += `CRITICAL: Ensure all suggestions are specifically appropriate for female recipients. Focus on women's sizes, styles, and preferences.\n`;
  }

  // Extract any specific interests from the prompt
  const interestMatch = prompt.toLowerCase().match(/(?:likes?|loves?|enjoys?|into)\s+([^.,!?]+)/i);
  const specificInterest = interestMatch ? interestMatch[1].trim() : null;

  enhancedPrompt += `
  CRITICAL REQUIREMENTS:
  1. Budget: Between $${minBudget} and $${maxBudget}
  ${specificInterest ? `2. IMPORTANT: Include 3-4 suggestions that directly relate to their interest in ${specificInterest}, but distribute them randomly throughout the list of suggestions` : ''}
  
  Quality Guidelines:
  - Focus on premium brands and materials
  - Include specific model numbers or editions
  - Emphasize uniqueness and exclusivity
  - Consider items that enhance lifestyle
  - Include at least one experience-based gift
  - Suggest items that show thoughtfulness
  ${isMale || isFemale ? `- Double-check that all clothing and accessories are for the correct gender` : ''}

  Format each suggestion as:
  "Brand Name Specific Product (Premium/Special Edition) - [Category] Version"

  IMPORTANT: Each suggestion must be:
  - Actually available for purchase
  - Within the specified budget range
  - Specific and detailed enough to find online
  - Unique and memorable
  ${isMale || isFemale ? `- Gender-appropriate for the recipient` : ''}`;

  return enhancedPrompt;
}