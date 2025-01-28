import { AmazonProduct } from './types.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import { formatProduct } from './searchUtils.ts';

// Optimized constants for better performance
const CONCURRENT_REQUESTS = 4; // Process 4 requests at a time
const BATCH_TIMEOUT = 8000; // 8 second timeout per batch
const RATE_LIMIT_DELAY = 250; // 250ms between requests within a batch

interface BatchSearchResult {
  products: AmazonProduct[];
  errors: string[];
}

const processBatchWithTimeout = async (
  searchPromises: Promise<AmazonProduct | null>[],
  timeout: number
): Promise<(AmazonProduct | null)[]> => {
  const timeoutPromise = new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error('Batch timeout')), timeout)
  );

  try {
    return await Promise.race([
      Promise.all(searchPromises),
      timeoutPromise.then(() => searchPromises.map(() => null))
    ]);
  } catch (error) {
    console.error('Batch processing error:', error);
    return searchPromises.map(() => null);
  }
};

export const batchSearchProducts = async (
  searchTerms: string[],
  apiKey: string
): Promise<BatchSearchResult> => {
  console.log(`Starting optimized batch search for ${searchTerms.length} terms`);
  const products: AmazonProduct[] = [];
  const errors: string[] = [];

  // Process searchTerms in chunks of CONCURRENT_REQUESTS
  for (let i = 0; i < searchTerms.length; i += CONCURRENT_REQUESTS) {
    const batchStart = performance.now();
    const currentBatch = searchTerms.slice(i, i + CONCURRENT_REQUESTS);
    console.log(`Processing batch ${i / CONCURRENT_REQUESTS + 1} with ${currentBatch.length} terms`);

    const batchPromises = currentBatch.map(async (term, index) => {
      // Add staggered delay within batch to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, index * RATE_LIMIT_DELAY));

      const url = new URL(`https://${RAPIDAPI_HOST}/search`);
      url.searchParams.append('query', term);
      url.searchParams.append('country', 'US');
      url.searchParams.append('category_id', 'aps');

      try {
        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.data?.products?.[0]) {
          console.log('No products found for term:', term);
          return null;
        }

        return formatProduct(data.data.products[0]);
      } catch (error) {
        console.error(`Error in batch search for term: ${term}`, error);
        return null;
      }
    });

    // Process batch with timeout
    const batchResults = await processBatchWithTimeout(batchPromises, BATCH_TIMEOUT);
    
    // Process results
    batchResults.forEach((result, index) => {
      if (result) {
        products.push(result);
      } else {
        errors.push(`Failed to find product for: ${currentBatch[index]}`);
      }
    });

    const batchDuration = performance.now() - batchStart;
    console.log(`Batch ${i / CONCURRENT_REQUESTS + 1} completed in ${batchDuration.toFixed(2)}ms`);

    // Add delay between batches if not the last batch
    if (i + CONCURRENT_REQUESTS < searchTerms.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * 2));
    }
  }

  console.log('Batch search completed:', {
    successCount: products.length,
    errorCount: errors.length,
    totalTime: performance.now()
  });

  return { products, errors };
};