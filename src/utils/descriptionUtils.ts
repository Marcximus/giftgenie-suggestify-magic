
import { supabase } from "@/integrations/supabase/client";

export const generateCustomDescription = async (title: string, originalDescription: string): Promise<string> => {
  try {
    if (!title) {
      console.warn('Cannot generate custom description: Missing title');
      return originalDescription;
    }

    // Create a consistent cache key based on the title
    const cacheKey = `description-${title.toLowerCase().trim()}`;
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

    // Check if the response has the description field
    if (!data || typeof data.description !== 'string') {
      console.error('Invalid response format from generate-custom-description:', data);
      return originalDescription;
    }

    const description = data.description;
    
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
