import { supabase } from "@/integrations/supabase/client";

export const generateCustomDescription = async (title: string, originalDescription: string): Promise<string> => {
  try {
    const cacheKey = `description-${title.toLowerCase().trim()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.functions.invoke('generate-custom-description', {
      body: { title, originalDescription }
    });

    if (error) {
      console.error('Error generating custom description:', error);
      return originalDescription;
    }

    const description = data.description || originalDescription;
    localStorage.setItem(cacheKey, description);
    return description;
  } catch (error) {
    console.error('Error calling generate-custom-description:', error);
    return originalDescription;
  }
};