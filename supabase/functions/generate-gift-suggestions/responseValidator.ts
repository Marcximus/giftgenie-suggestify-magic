export function validateAndCleanSuggestions(content: string, originalPriceRange: string | null) {
  try {
    let suggestions;
    
    try {
      suggestions = JSON.parse(content);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse suggestions JSON');
    }

    if (!Array.isArray(suggestions)) {
      throw new Error('Response is not an array');
    }

    return suggestions.filter((suggestion, index) => {
      try {
        const requiredFields = ['title', 'description', 'priceRange', 'reason'];
        const missingFields = requiredFields.filter(field => !suggestion[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Suggestion ${index} missing fields:`, missingFields);
          return false;
        }

        // Ensure priceRange is properly formatted
        if (!suggestion.priceRange.match(/^\$?\d+\s*-\s*\$?\d+$/)) {
          console.warn(`Invalid price range format for suggestion ${index}:`, suggestion.priceRange);
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
      } catch (error) {
        console.error(`Error validating suggestion ${index}:`, error);
        return false;
      }
    });
  } catch (error) {
    console.error('Failed to validate suggestions:', error);
    throw error;
  }
}