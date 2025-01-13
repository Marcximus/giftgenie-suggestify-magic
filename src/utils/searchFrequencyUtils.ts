import { supabase } from "@/integrations/supabase/client";

export const updateSearchFrequency = async (searchTerm: string) => {
  try {
    const { data, error } = await supabase
      .from('popular_searches')
      .upsert(
        { 
          search_term: searchTerm.toLowerCase().trim(),
          frequency: 1,
          last_searched: new Date().toISOString()
        },
        {
          onConflict: 'search_term',
          ignoreDuplicates: false
        }
      )
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating search frequency:', error);
  }
};

export const getPopularSearches = async () => {
  try {
    const { data: popularSearches } = await supabase
      .from('popular_searches')
      .select('search_term')
      .order('frequency', { ascending: false })
      .order('last_searched', { ascending: false })
      .limit(20);

    return popularSearches;
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    return [];
  }
};