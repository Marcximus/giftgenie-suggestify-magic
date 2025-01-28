import { supabase } from "@/integrations/supabase/client";

interface DescriptionRequest {
  title: string;
  description: string;
}

export const generateCustomDescriptions = async (requests: DescriptionRequest[]): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-custom-description', {
      body: { descriptions: requests }
    });

    if (error) {
      console.error('Error generating custom descriptions:', error);
      return requests.map(r => r.description);
    }

    return data.descriptions || requests.map(r => r.description);
  } catch (error) {
    console.error('Error calling generate-custom-description:', error);
    return requests.map(r => r.description);
  }
};

export const generateCustomDescription = async (title: string, originalDescription: string): Promise<string> => {
  const descriptions = await generateCustomDescriptions([{ title, description: originalDescription }]);
  return descriptions[0];
};