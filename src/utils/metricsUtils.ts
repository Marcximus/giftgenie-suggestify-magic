import { supabase } from "@/integrations/supabase/client";

export const logApiMetrics = async (
  endpoint: string,
  startTime: number,
  status: string,
  errorMessage?: string,
  cacheHit: boolean = false
) => {
  try {
    await supabase.from('api_metrics').insert({
      endpoint,
      duration_ms: Math.round(performance.now() - startTime),
      status,
      error_message: errorMessage,
      cache_hit: cacheHit
    });
  } catch (error) {
    console.error('Error logging API metrics:', error);
  }
};