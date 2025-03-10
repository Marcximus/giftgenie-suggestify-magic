import { toast } from "@/components/ui/use-toast";
import { calculateBackoffDelay, sleep } from './rateLimiter';

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number = 1000
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
      
      // Don't wait on the last attempt
      if (retryCount < maxRetries) {
        const backoffDelay = calculateBackoffDelay(retryCount);
        console.log(`Backing off for ${backoffDelay}ms before retry ${retryCount}`);
        await sleep(backoffDelay);
      }
    }
  }
  
  console.error(`All ${maxRetries} retry attempts failed`);
  throw lastError!;
};