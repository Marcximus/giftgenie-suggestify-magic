/**
 * Extracts price range from user input
 * @param input User input string
 * @returns Object with min and max price, or null if no price range found
 */
export const extractPriceRange = (input: string): { min: number; max: number } | null => {
  // Clean input and convert to lowercase for consistent processing
  const cleanInput = input.toLowerCase().trim();
  
  // Pattern for explicit budget mentions with numbers
  const budgetPattern = /(?:budget|price|cost)(?:\s+is)?(?:\s*:)?\s*\$?\s*(\d+)(?:\s*-\s*\$?\s*(\d+))?/i;
  const budgetMatch = cleanInput.match(budgetPattern);

  // Pattern for plain number ranges (but not age ranges)
  const rangePattern = /\$?\s*(\d+)\s*-\s*\$?\s*(\d+)(?!\s*(?:year|yr|age|month|day)s?\b)/i;
  const rangeMatch = cleanInput.match(rangePattern);

  if (budgetMatch) {
    console.log('Found budget match:', budgetMatch);
    // If we have a range in the budget
    if (budgetMatch[2]) {
      return {
        min: parseFloat(budgetMatch[1]),
        max: parseFloat(budgetMatch[2])
      };
    }
    // Single budget number - create a range around it
    const budget = parseFloat(budgetMatch[1]);
    return {
      min: budget * 0.8, // 20% below
      max: budget * 1.2  // 20% above
    };
  }

  if (rangeMatch && !cleanInput.includes('age')) {
    console.log('Found range match:', rangeMatch);
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2])
    };
  }

  console.log('No price range found in input:', cleanInput);
  return null;
};