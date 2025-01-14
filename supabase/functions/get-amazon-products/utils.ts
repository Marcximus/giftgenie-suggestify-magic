export const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};