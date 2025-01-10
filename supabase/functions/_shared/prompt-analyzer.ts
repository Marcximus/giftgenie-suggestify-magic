export function analyzePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  return {
    hasGender: lowerPrompt.includes('man') || lowerPrompt.includes('woman') || 
               lowerPrompt.includes('boy') || lowerPrompt.includes('girl'),
    hasAge: /\d+/.test(prompt),
    hasInterests: lowerPrompt.includes('likes') || lowerPrompt.includes('loves') || 
                  lowerPrompt.includes('enjoys') || lowerPrompt.includes('interested'),
    isMale: lowerPrompt.includes('man') || lowerPrompt.includes('boy') || 
            lowerPrompt.includes('father') || lowerPrompt.includes('husband') || 
            lowerPrompt.includes('boyfriend') || lowerPrompt.includes('brother'),
    hasEverything: lowerPrompt.includes('has everything') || 
                   lowerPrompt.includes('hard to shop for') || 
                   lowerPrompt.includes('difficult to buy for'),
    budgetMatch: prompt.match(/(?:budget|USD|price)[^\d]*(\d+)(?:\s*-\s*(\d+))?/i)
  };
}