import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PerformanceMetric {
  endpoint: string;
  duration_ms: number;
  status: string;
  error_message?: string;
  cache_hit?: boolean;
}

const metrics: PerformanceMetric[] = [];
const BATCH_SIZE = 10;
let batchTimeout: NodeJS.Timeout | null = null;

export const logApiMetrics = async (
  endpoint: string,
  startTime: number,
  status: string,
  errorMessage?: string,
  cacheHit: boolean = false
) => {
  const duration = Math.round(performance.now() - startTime);
  console.log(`Performance metric - ${endpoint}: ${duration}ms (${status})`);
  
  const metric = {
    endpoint,
    duration_ms: duration,
    status,
    error_message: errorMessage,
    cache_hit: cacheHit
  };
  
  metrics.push(metric);
  
  // Schedule batch insert if not already scheduled
  if (!batchTimeout && metrics.length >= BATCH_SIZE) {
    await flushMetrics();
  } else if (!batchTimeout) {
    batchTimeout = setTimeout(flushMetrics, 5000); // Flush after 5 seconds
  }
};

const flushMetrics = async () => {
  if (metrics.length === 0) return;
  
  const metricsToInsert = [...metrics];
  metrics.length = 0; // Clear the array
  
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  
  try {
    const { error } = await supabase
      .from('api_metrics')
      .insert(metricsToInsert);
      
    if (error) {
      console.error('Error logging metrics:', error);
      toast({
        title: "Metrics Error",
        description: "Failed to log performance metrics",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error('Error in metrics batch insert:', error);
  }
};

// Add performance markers for specific operations
export const markOperation = (name: string) => {
  performance.mark(`${name}-start`);
  return {
    end: () => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name).pop();
      if (measure) {
        console.log(`Operation ${name} took ${measure.duration.toFixed(2)}ms`);
      }
      // Cleanup
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    }
  };
};

// Add this to track slow operations specifically
export const trackSlowOperation = async (
  operationName: string,
  threshold: number,
  operation: () => Promise<any>
) => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    if (duration > threshold) {
      console.warn(`Slow operation detected - ${operationName}: ${duration.toFixed(2)}ms`);
      await logApiMetrics(
        `slow-operation-${operationName}`,
        startTime,
        'warning',
        `Operation exceeded ${threshold}ms threshold`
      );
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    await logApiMetrics(
      `failed-operation-${operationName}`,
      startTime,
      'error',
      error.message
    );
    throw error;
  }
};

// Automatically flush remaining metrics when the page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (metrics.length > 0) {
      flushMetrics();
    }
  });
}