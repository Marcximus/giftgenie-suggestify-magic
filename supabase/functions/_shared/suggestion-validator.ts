export function validateAndCleanSuggestions(rawSuggestions: string): string[] {
  try {
    // Clean up JSON string
    const cleanedJson = rawSuggestions.replace(/```json\n?|\n?```/g, '').trim();
    const suggestions = JSON.parse(cleanedJson);

    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    // Filter and validate suggestions
    return suggestions
      .filter(suggestion => 
        typeof suggestion === 'string' && 
        suggestion.trim().length > 0
      )
      .map(suggestion => suggestion.trim());

  } catch (error) {
    console.error('Error validating suggestions:', error);
    throw new Error('Failed to parse suggestions');
  }
}