import { useState } from 'react';
import { useOpenAISuggestions } from './useOpenAISuggestions';
import { useAmazonProductProcessing } from './useAmazonProductProcessing';
import { GiftSuggestion } from '@/types/suggestions';

export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  
  const { generateSuggestions } = useOpenAISuggestions();
  const { processSuggestions } = useAmazonProductProcessing();

  const generateGiftSuggestions = async (query: string, append: boolean = false) => {
    if (!query.trim()) return;
    
    setIsLoading(true);

    try {
      const newSuggestions = await generateSuggestions(query);
      
      if (newSuggestions) {
        const processedSuggestions = await processSuggestions(newSuggestions);
        setSuggestions(prev => append ? [...prev, ...processedSuggestions] : processedSuggestions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setLastQuery(query);
    await generateGiftSuggestions(query, false);
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      await generateGiftSuggestions(lastQuery, true);
    }
  };

  const handleMoreLikeThis = async (title: string) => {
    const query = lastQuery.toLowerCase();
    
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

    const interestMatch = query.match(/who likes\s+([^.]+)/i);
    const interestContext = interestMatch ? `related to ${interestMatch[1].trim()}` : '';

    const genderContext = isMale ? 'male' : isFemale ? 'female' : '';
    const genderInstruction = genderContext ? 
      `IMPORTANT: Only suggest gifts appropriate for ${genderContext} recipients.` : '';
    
    const cleanTitle = title.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
    
    const contextualPrompt = `Find me 8 gift suggestions similar to "${cleanTitle}" ${ageContext} ${budgetContext} ${interestContext}. ${genderInstruction}`;
    
    setLastQuery(contextualPrompt);
    await generateGiftSuggestions(contextualPrompt);
  };

  const handleStartOver = () => {
    setSuggestions([]);
    setLastQuery('');
    window.location.reload();
  };

  return {
    isLoading,
    suggestions,
    handleSearch,
    handleGenerateMore,
    handleMoreLikeThis,
    handleStartOver
  };
};