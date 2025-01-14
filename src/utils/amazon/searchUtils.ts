import { waitForRateLimit, logRequest } from './rateLimiter';
import { cleanSearchTerm } from './utils';
import { toast } from "@/components/ui/use-toast";

export const searchWithFallback = async (
  searchTerm: string,
  apiKey: string,
  rapidApiHost: string
) => {
  console.log('Starting search with fallback for:', searchTerm);
  
  let retryCount = 0;
  const MAX_RETRIES = 2;

  while (retryCount < MAX_RETRIES) {
    try {
      await waitForRateLimit(retryCount);

      // First try with exact search term
      const searchData = await performSearch(searchTerm, apiKey, rapidApiHost);
      
      if (searchData?.data?.products?.length > 0) {
        return searchData;
      }

      // If no results, try with simplified search term
      const simplifiedTerm = simplifySearchTerm(searchTerm);
      console.log('Trying simplified search term:', simplifiedTerm);
      
      await waitForRateLimit(retryCount);
      const fallbackData = await performSearch(simplifiedTerm, apiKey, rapidApiHost);
      
      if (fallbackData?.data?.products?.length > 0) {
        return fallbackData;
      }

      return null;
    } catch (error: any) {
      console.error('Error in searchWithFallback:', error);
      
      if (error.status === 429) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log(`Rate limited (429), retry ${retryCount} of ${MAX_RETRIES}, waiting ${delay}ms`);
        toast({
          title: "Please wait",
          description: "We're processing your request...",
          duration: delay,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (error.status === 403) {
        console.error('API subscription error');
        toast({
          title: "Service Temporarily Unavailable",
          description: "We're experiencing some technical difficulties. Please try again later.",
          variant: "destructive",
        });
      }
      
      throw error;
    }
  }

  return null;
};

const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string
) => {
  const cleanedTerm = cleanSearchTerm(term);
  console.log('Performing search for:', cleanedTerm);

  logRequest();

  const searchResponse = await fetch(
    `https://${rapidApiHost}/search?query=${encodeURIComponent(cleanedTerm)}&country=US`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': rapidApiHost,
      }
    }
  );

  if (!searchResponse.ok) {
    const error = new Error(`Amazon Search API error: ${searchResponse.status}`);
    (error as any).status = searchResponse.status;
    throw error;
  }

  return await searchResponse.json();
};

const simplifySearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(?:edition|version|series)\b/gi, '')
    .replace(/-.*$/, '')
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '')
    .trim();
};