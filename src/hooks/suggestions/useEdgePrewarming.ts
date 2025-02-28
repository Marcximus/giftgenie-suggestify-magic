
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useEdgePrewarming = () => {
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Pre-warm the Edge Function on initial load to reduce cold start latency
  useEffect(() => {
    const preWarmEdgeFunction = async () => {
      if (isFirstLoad) {
        try {
          console.log('Pre-warming Edge Function...');
          await supabase.functions.invoke('get-amazon-products', {
            body: { searchTerm: 'test pre-warm' }
          });
          console.log('Edge Function pre-warmed successfully');
        } catch (error) {
          console.log('Pre-warming error (can be ignored):', error);
        } finally {
          setIsFirstLoad(false);
        }
      }
    };
    
    preWarmEdgeFunction();
  }, [isFirstLoad]);

  return { isFirstLoad };
};
