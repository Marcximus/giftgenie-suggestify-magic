import { toast } from "@/components/ui/use-toast";
import { calculateBackoffDelay, sleep } from './rateLimiter';

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> => {
  let lastError: Error;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      retryCount++;
      
      console.log(`Attempt ${retryCount} failed:`, {
        error: error.message,
        status: error.status,
        retryAfter: error.headers?.get('retry-after')
      });
      
      // If we've used all retries, throw the error
      if (retryCount === maxRetries) {
        console.error(`All ${maxRetries} retry attempts failed`);
        throw lastError;
      }
      
      // If we get a rate limit error, use the retry-after header if available
      if (error.status === 429) {
        const retryAfter = parseInt(error.headers?.get('retry-after') || '15', 10);
        console.log(`Rate limited, waiting ${retryAfter} seconds`);
        
        toast({
          title: "Rate limit reached",
          description: `Waiting ${retryAfter} seconds before retrying...`,
          variant: "destructive",
        });
        
        await sleep(retryAfter * 1000);
        continue;
      }
      
      // Calculate exponential backoff delay
      const backoffDelay = calculateBackoffDelay(retryCount, baseDelay, maxDelay);
      
      console.log(`Backing off for ${backoffDelay}ms before retry ${retryCount}`);
      await sleep(backoffDelay);
    }
  }
  
  throw lastError!;
};

export const retryWithTimeout = async <T>(
  fn: () => Promise<T>,
  timeout: number = 5000, // Reduced from 8000 to 5000ms
  maxRetries: number = 3
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeout);
  });

  return withRetry(
    () => Promise.race([fn(), timeoutPromise]),
    maxRetries
  );
};