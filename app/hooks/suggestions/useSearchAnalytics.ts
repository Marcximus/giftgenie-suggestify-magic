
import { supabase } from "@/integrations/supabase/client";
import { GiftSuggestion } from '@/types/suggestions';

export const useSearchAnalytics = () => {
  const trackSearchAnalytics = async (query: string, suggestions: GiftSuggestion[]) => {
    try {
      console.log('Tracking search analytics for query:', query);
      console.log('Suggestions to track:', suggestions);
      
      const titles = suggestions.map(s => s.title);
      console.log('Extracted titles:', titles);
      
      const { data, error } = await supabase.from('search_analytics').insert({
        search_query: query,
        suggestion_titles: titles,
        user_agent: navigator.userAgent
      }).select();

      if (error) {
        console.error('Supabase error tracking search:', error);
        throw error;
      }
      
      console.log('Successfully tracked search analytics:', data);
    } catch (error) {
      console.error('Error tracking search analytics:', error);
    }
  };

  return { trackSearchAnalytics };
};
