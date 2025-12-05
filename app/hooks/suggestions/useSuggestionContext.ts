
export const useSuggestionContext = () => {
  const extractContextFromQuery = (query: string) => {
    // Extract context from the last query
    const isMale = query.includes('brother') || 
                  query.includes('father') || 
                  query.includes('husband') || 
                  query.includes('boyfriend') || 
                  query.includes('son') || 
                  query.includes('grandpa');

    const isFemale = query.includes('sister') || 
                    query.includes('mother') || 
                    query.includes('wife') || 
                    query.includes('girlfriend') || 
                    query.includes('daughter') || 
                    query.includes('grandma');

    const ageMatch = query.match(/(\d+)(?:\s*-\s*\d+)?\s*years?\s*old/i);
    const ageContext = ageMatch ? `for ${ageMatch[0]}` : '';

    const budgetMatch = query.match(/budget:\s*(\$?\d+(?:\s*-\s*\$?\d+)?)/i) || 
                       query.match(/(\$?\d+(?:\s*-\s*\$?\d+)?)\s*budget/i);
    const budgetContext = budgetMatch ? `within the budget of ${budgetMatch[1]}` : '';

    const genderContext = isMale ? 'male' : isFemale ? 'female' : '';
    
    return {
      isMale,
      isFemale,
      ageContext,
      budgetContext,
      genderContext
    };
  };

  const generateMoreLikeThisPrompt = (title: string, query: string) => {
    // Extract key product characteristics from the title
    const keywords = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => 
        !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word)
      )
      .filter(word => word.length > 2)
      .slice(0, 3)
      .join(' ');
    
    const context = extractContextFromQuery(query);
    const genderInstruction = context.genderContext ? 
      `IMPORTANT: Only suggest gifts appropriate for ${context.genderContext} recipients.` : '';
    
    const contextualPrompt = `Find me 8 gift suggestions that are very similar to "${keywords}" in terms of type, style, and purpose. Focus on products that serve a similar function or appeal to people who would like "${title}". ${context.ageContext} ${context.budgetContext} ${genderInstruction}

IMPORTANT GUIDELINES:
- Suggest products that are DIRECTLY related to or complement "${keywords}"
- Include variations of similar products with different features
- Include alternative brands offering similar functionality
- Focus on the same product category and use case
- Maintain similar quality level and target audience`;
    
    console.log('Generated "More like this" prompt:', contextualPrompt);
    return contextualPrompt;
  };

  return { extractContextFromQuery, generateMoreLikeThisPrompt };
};
