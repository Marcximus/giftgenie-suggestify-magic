
import { supabase } from "@/integrations/supabase/client";

export const generateCustomDescription = async (title: string, originalDescription: string): Promise<string> => {
  try {
    // Create a consistent cache key based on the title
    const cacheKey = `description-${title.toLowerCase().trim()}`;
    
    // Check if we have a cached description
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      console.log('Using cached description for:', title);
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
    
    // Cache the result
    localStorage.setItem(cacheKey, description);
    return description;
  } catch (error) {
    console.error('Error calling generate-custom-description:', error);
    return originalDescription;
  }
};

// Helper function to get a description synchronously from cache
export const getDescriptionFromCache = (title: string): string | null => {
  if (!title) return null;
  const cacheKey = `description-${title.toLowerCase().trim()}`;
  return localStorage.getItem(cacheKey);
};
