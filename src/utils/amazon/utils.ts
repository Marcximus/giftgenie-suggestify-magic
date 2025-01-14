/**
 * Cleans a search term by:
 * 1. Removing HTML entities
 * 2. Removing special characters
 * 3. Trimming whitespace
 */
export const cleanSearchTerm = (term: string): string => {
  // First decode any HTML entities
  const decoded = term.replace(/&quot;/g, '"')
                     .replace(/&amp;/g, '&')
                     .replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>')
                     .replace(/&#39;/g, "'")
                     .replace(/&ndash;/g, '-')
                     .replace(/&mdash;/g, '-');
  
  // Then clean special characters, keeping only alphanumeric, spaces, and basic punctuation
  const cleaned = decoded.replace(/[^\w\s\-,.()]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
  
  return cleaned;
};
