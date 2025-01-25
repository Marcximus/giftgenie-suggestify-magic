export function buildGiftPrompt(prompt: string, numSuggestions: number = 8): string {
  return `Based on the request "${prompt}", suggest ${numSuggestions} varied, unique and highly recommendable gift ideas.

Consider:
- Age, gender, and occasion mentioned
- Any budget constraints specified
- The recipient's interests and preferences

Format EACH suggestion as a string in this EXACT format:
"[Brand Name] [Specific Product Model] ([Premium/Special Edition if applicable])"

Example format: "Sony WH-1000XM4 Wireless Noise-Cancelling Headphones (Premium Edition)"

Return ONLY a JSON array of exactly ${numSuggestions} strings, each following this format.`;
}