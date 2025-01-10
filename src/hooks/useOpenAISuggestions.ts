import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GiftSuggestion } from '@/types/suggestions';

export const useOpenAISuggestions = () => {
  const { toast } = useToast();

  const generateSuggestions = async (query: string): Promise<GiftSuggestion[] | null> => {
    try {
      console.log('Generating suggestions for query:', query);
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      if (error) {
        console.error('Error from generate-gift-suggestions:', error);
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid response format');
      }

      return data.suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get gift suggestions. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  return { generateSuggestions };
};