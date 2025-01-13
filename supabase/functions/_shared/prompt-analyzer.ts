export function analyzePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  const isMale = lowerPrompt.includes('man') || lowerPrompt.includes('boy') || 
                 lowerPrompt.includes('father') || lowerPrompt.includes('husband') || 
                 lowerPrompt.includes('boyfriend') || lowerPrompt.includes('brother') ||
                 lowerPrompt.includes('grandpa') || lowerPrompt.includes('uncle');

  const isFemale = lowerPrompt.includes('woman') || lowerPrompt.includes('girl') || 
                   lowerPrompt.includes('mother') || lowerPrompt.includes('wife') || 
                   lowerPrompt.includes('girlfriend') || lowerPrompt.includes('sister') ||
                   lowerPrompt.includes('grandma') || lowerPrompt.includes('aunt');
  
  return {
    hasGender: isMale || isFemale,
    hasAge: /\d+/.test(prompt),
    hasInterests: lowerPrompt.includes('likes') || lowerPrompt.includes('loves') || 
                  lowerPrompt.includes('enjoys') || lowerPrompt.includes('interested'),
    isMale,
    isFemale,
    hasEverything: lowerPrompt.includes('has everything') || 
                   lowerPrompt.includes('hard to shop for') || 
                   lowerPrompt.includes('difficult to buy for'),
    budgetMatch: prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i)
  };
}