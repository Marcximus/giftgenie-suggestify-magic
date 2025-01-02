export function validateAndCleanSuggestions(content: string, originalPriceRange: string | null) {
  try {
    const cleanedContent = content.trim()
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim();
    
    const suggestions = JSON.parse(cleanedContent);

    if (!Array.isArray(suggestions)) {
      throw new Error('Response is not an array');
    }

    return suggestions.filter((suggestion, index) => {
      const requiredFields = ['title', 'description', 'priceRange', 'reason'];
      const missingFields = requiredFields.filter(field => !suggestion[field]);
      
      if (missingFields.length > 0) {
        console.warn(`Suggestion ${index} missing fields:`, missingFields);
        return false;
      }

      if (originalPriceRange) {
        const [minStr, maxStr] = originalPriceRange.split('-').map(n => parseInt(n));
        const min = minStr * 0.8;
        const max = maxStr * 1.2;
        
        const suggestedPrice = suggestion.priceRange.replace(/[^0-9-]/g, '');
        const [suggestedMin, suggestedMax] = suggestedPrice.split('-').map(n => parseInt(n));
        
        if (suggestedMin < min || suggestedMax > max) {
          console.warn(`Suggestion ${index} outside price range:`, suggestion.priceRange);
          return false;
        }
      }

      return true;
    });
  } catch (error) {
    console.error('Failed to parse or validate suggestions:', error);
    throw error;
  }
}