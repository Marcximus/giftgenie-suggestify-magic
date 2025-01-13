export function analyzePrompt(prompt: string) {
  const analysis = {
    hasAge: false,
    age: null as number | null,
    ageCategory: null as string | null,
    gender: null as string | null,
    interests: [] as string[],
    budget: {
      min: null as number | null,
      max: null as number | null
    }
  };

  // Age detection
  const ageMatch = prompt.match(/\b(\d+)\s*(year|years|yr|yrs|month|months|mo|mos)?\s*(old)?\b/i);
  if (ageMatch) {
    analysis.hasAge = true;
    const age = parseInt(ageMatch[1]);
    analysis.age = age;

    // Determine age category
    if (ageMatch[2]?.toLowerCase().includes('month')) {
      analysis.ageCategory = 'infant';
    } else if (age <= 2) {
      analysis.ageCategory = 'infant';
    } else if (age <= 12) {
      analysis.ageCategory = 'child';
    } else if (age <= 19) {
      analysis.ageCategory = 'teen';
    } else if (age <= 29) {
      analysis.ageCategory = 'youngAdult';
    } else if (age >= 65) {
      analysis.ageCategory = 'senior';
    } else {
      analysis.ageCategory = 'adult';
    }
  }

  // Gender detection
  const maleTerms = ['male', 'man', 'boy', 'husband', 'boyfriend', 'father', 'dad', 'brother', 'uncle', 'grandfather', 'grandpa'];
  const femaleTerms = ['female', 'woman', 'girl', 'wife', 'girlfriend', 'mother', 'mom', 'sister', 'aunt', 'grandmother', 'grandma'];

  const words = prompt.toLowerCase().split(/\s+/);
  if (maleTerms.some(term => words.includes(term))) {
    analysis.gender = 'male';
  } else if (femaleTerms.some(term => words.includes(term))) {
    analysis.gender = 'female';
  }

  // Budget detection
  const budgetMatch = prompt.match(/\$?(\d+)(?:\s*-\s*\$?(\d+))?/);
  if (budgetMatch) {
    analysis.budget.min = parseInt(budgetMatch[1]);
    analysis.budget.max = budgetMatch[2] ? parseInt(budgetMatch[2]) : analysis.budget.min * 1.5;
  }

  // Interest detection
  const interestMatch = prompt.match(/(?:likes?|loves?|enjoys?|into)\s+([^.,!?]+)/i);
  if (interestMatch) {
    analysis.interests = interestMatch[1].trim().split(/\s*(?:,|and)\s*/);
  }

  console.log('Prompt analysis result:', analysis);
  return analysis;
}