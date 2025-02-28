
import { supabase } from "@/integrations/supabase/client";

// Add an in-memory cache to avoid localStorage checks on every render
const memoryCache: Record<string, string> = {};

export const generateCustomDescription = async (title: string, originalDescription: string): Promise<string> => {
  try {
    if (!title) {
      console.log('No title provided for description generation');
      return originalDescription;
    }
    
    // Create a consistent cache key based on the title
    const cacheKey = `description-${title.toLowerCase().trim()}`;
    
    // First check memory cache
    if (memoryCache[cacheKey]) {
      console.log('Using memory-cached description for:', title);
      return memoryCache[cacheKey];
    }
    
    // Then check localStorage
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      console.log('Using localStorage description for:', title);
      // Update memory cache
      memoryCache[cacheKey] = cached;
      return cached;
    }

    console.log('Generating custom description for:', {
      title,
      originalDescription
    });

    const { data, error } = await supabase.functions.invoke('generate-custom-description', {
      body: { 
        title, 
        description: originalDescription 
      }
    });

    if (error) {
      console.error('Error generating custom description:', error);
      return originalDescription;
    }

    const description = data?.description || originalDescription;
    
    console.log('Generated description:', {
      title,
      original: originalDescription,
      generated: description
    });
    
    // Update both memory cache and localStorage
    memoryCache[cacheKey] = description;
    localStorage.setItem(cacheKey, description);
    
    return description;
  } catch (error) {
    console.error('Error calling generate-custom-description:', error);
    return originalDescription;
  }
};

// Helper function to get a description synchronously from cache ONLY
// This function does NOT trigger any API calls or state updates
export const getDescriptionFromCache = (title: string): string | null => {
  if (!title) return null;
  
  const cacheKey = `description-${title.toLowerCase().trim()}`;
  
  // First check memory cache
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }
  
  // Then check localStorage
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    // Update memory cache
    memoryCache[cacheKey] = cached;
    return cached;
  }
  
  return null;
};
