import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GiftSuggestionsResponse } from '@/types/suggestions';

const useDeepSeekSuggestions = () => {
  const { toast } = useToast();

  const generateSuggestions = async (query: string): Promise<GiftSuggestionsResponse | null> => {
    try {
      console.log('Generating suggestions with DeepSeek for query:', query);
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      if (error) {
        console.error('Error from generate-gift-suggestions:', error);
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        console.error('Invalid response format from DeepSeek:', data);
        throw new Error('Invalid response format');
      }

      return {
        suggestions: data.suggestions,
        priceRange: data.priceRange
      };
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

export default useDeepSeekSuggestions;