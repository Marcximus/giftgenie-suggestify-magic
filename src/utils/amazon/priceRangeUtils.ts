/**
 * Extracts price range from user input with 20% margin
 * @param input User input string
 * @returns Object with min and max price, or null if no price range found
 */
export const extractPriceRangeFromInput = (input: string): { min: number; max: number } | null => {
  // Clean input and convert to lowercase for consistent processing
  const cleanInput = input.toLowerCase().trim();
  
  // Pattern for explicit budget/price range mentions
  const budgetPattern = /(?:budget|price|cost)(?:\s+is)?(?:\s*:)?\s*\$?\s*(\d+(?:\s*-\s*\d+)?)/i;
  const budgetMatch = cleanInput.match(budgetPattern);

  // Pattern for "around X" or "about X" mentions
  const aroundPattern = /(?:around|about|approximately|roughly|~)\s*\$?\s*(\d+)/i;
  const aroundMatch = cleanInput.match(aroundPattern);

  // Pattern for plain number ranges (but not age ranges followed by "years" or similar)
  const rangePattern = /\$?\s*(\d+)\s*-\s*\$?\s*(\d+)(?!\s*(?:year|yr|age|month|day)s?\b)/i;
  const rangeMatch = cleanInput.match(rangePattern);

  let min: number;
  let max: number;

  if (budgetMatch) {
    const budgetStr = budgetMatch[1];
    if (budgetStr.includes('-')) {
      // Handle range in budget
      const [minStr, maxStr] = budgetStr.split('-').map(s => s.trim());
      min = parseFloat(minStr);
      max = parseFloat(maxStr);
    } else {
      // Single budget number
      const budget = parseFloat(budgetStr);
      min = budget * 0.8; // 20% below
      max = budget * 1.2; // 20% above
    }
  } else if (aroundMatch) {
    // Handle "around X" cases
    const target = parseFloat(aroundMatch[1]);
    min = target * 0.8;
    max = target * 1.2;
  } else if (rangeMatch && !cleanInput.includes('age')) {
    // Handle explicit ranges, excluding age ranges
    min = parseFloat(rangeMatch[1]);
    max = parseFloat(rangeMatch[2]);
  } else {
    // No valid price range found
    return null;
  }

  // Apply 20% margin to any found range
  const finalMin = min * 0.8;
  const finalMax = max * 1.2;

  // Validate the range
  if (isNaN(finalMin) || isNaN(finalMax) || finalMin < 0 || finalMax < finalMin) {
    return null;
  }

  return {
    min: Math.round(finalMin * 100) / 100, // Round to 2 decimal places
    max: Math.round(finalMax * 100) / 100
  };
};