export function buildGiftPrompt(prompt: string, numSuggestions: number = 3, batchIndex: number = 0): string {
  // Add context about which batch this is to encourage diversity
  const contextPrefix = batchIndex > 0 
    ? `For batch ${batchIndex + 1}, suggest ${numSuggestions} MORE gift ideas that are COMPLETELY DIFFERENT from typical suggestions. These must be from DIFFERENT product categories than previous suggestions. `
    : '';

  return `${contextPrefix}Based on the request "${prompt}", suggest ${numSuggestions} varied, unique and highly recommendable gift ideas.

Consider:
- Age, gender, and occasion mentioned
- Any budget constraints specified
- The recipient's interests and preferences
- Each suggestion should be from a DIFFERENT product category
- Avoid suggesting similar items (e.g., don't suggest multiple necklaces or multiple palettes)

Format EACH suggestion as a string in this EXACT format:
"[Brand Name] [Specific Product Model] ([Premium/Special Edition if applicable])"

Example format: "Sony WH-1000XM4 Wireless Noise-Cancelling Headphones (Premium Edition)"

Return ONLY a JSON array of exactly ${numSuggestions} strings, each following this format.`;
}