export function validateAndCleanSuggestions(rawSuggestions: string): string[] {
  try {
    // Clean up JSON string
    const cleanedJson = rawSuggestions.replace(/```json\n?|\n?```/g, '').trim();
    console.log('Cleaned JSON:', cleanedJson);
    
    let suggestions: unknown;
    try {
      suggestions = JSON.parse(cleanedJson);
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid JSON format');
    }

    if (!Array.isArray(suggestions)) {
      console.error('Not an array:', suggestions);
      throw new Error('Suggestions must be an array');
    }

    // Filter and validate suggestions
    const validSuggestions = suggestions
      .filter(suggestion => {
        if (typeof suggestion !== 'string') {
          console.warn('Invalid suggestion type:', suggestion);
          return false;
        }
        if (suggestion.trim().length === 0) {
          console.warn('Empty suggestion found');
          return false;
        }
        return true;
      })
      .map(suggestion => suggestion.trim());

    if (validSuggestions.length === 0) {
      throw new Error('No valid suggestions after filtering');
    }

    console.log('Valid suggestions:', validSuggestions);
    return validSuggestions;

  } catch (error) {
    console.error('Error validating suggestions:', error);
    throw new Error(`Failed to parse suggestions: ${error.message}`);
  }
}