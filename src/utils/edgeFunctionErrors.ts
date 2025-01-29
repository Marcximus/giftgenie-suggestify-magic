import { toast } from '@/hooks/use-toast';

interface EdgeFunctionError {
  message: string;
  origin?: string;
  method?: string;
  stack?: string;
  error_type?: string;
}

export const handleEdgeFunctionError = async (error: EdgeFunctionError, retryCount: number, maxRetries: number) => {
  console.error('Edge Function Error:', {
    message: error.message,
    type: error.error_type,
    origin: error.origin,
    method: error.method,
    stack: error.stack
  });

  // Check if we should retry
  if (retryCount < maxRetries && 
      (error.message.includes('Failed to fetch') || 
       error.message.includes('Failed to send a request'))) {
    
    const backoffDelay = Math.pow(2, retryCount) * 1000;
    toast({
      title: "Connection Error",
      description: `Retrying in ${backoffDelay / 1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`,
    });
    
    return true; // Signal to retry
  }

  // Handle specific error types
  if (error.message.includes('CORS')) {
    toast({
      title: "CORS Error",
      description: "There was a cross-origin resource sharing error. Please check your function configuration.",
      variant: "destructive"
    });
  } else if (error.message.includes('timeout')) {
    toast({
      title: "Timeout Error",
      description: "The request took too long to complete. Please try again.",
      variant: "destructive"
    });
  } else {
    toast({
      title: "Generation Error",
      description: "Failed to generate content. Please try again later.",
      variant: "destructive"
    });
  }

  return false; // Signal not to retry
};