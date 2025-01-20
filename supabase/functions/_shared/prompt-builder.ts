export function buildGiftPrompt(prompt: string): string {
  return `As an extremly qualified gift suggestion expert, consider age, gender, occasion and budget and suggest 8 varied, unique and highly recommendable gift ideas to a puzzled gift giver based on "${prompt}". 

Format each suggestion as: Brand Name Specific Product Model (Premium/Special Edition).

Return ONLY a JSON array of 8 specific gift suggestions.`;
}