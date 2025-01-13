export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed, retrying...`, error);
      
      // If we get a rate limit error, use the retry-after header if available
      if (error.status === 429) {
        const retryAfter = parseInt(error.headers?.get('retry-after') || '15', 10);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      // Don't wait on the last attempt
      if (i < maxRetries - 1) {
        const backoffDelay = Math.min(
          delay * Math.pow(2, i),
          3000 // Max backoff delay
        );
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError!;
};