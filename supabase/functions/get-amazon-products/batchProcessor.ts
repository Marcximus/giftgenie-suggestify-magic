import { AmazonProduct } from './types';
import { corsHeaders } from '../_shared/cors';
import { RAPIDAPI_HOST } from './config';
import { formatProduct } from './searchUtils';

interface BatchSearchResult {
  products: AmazonProduct[];
  errors: string[];
}

export const batchSearchProducts = async (
  searchTerms: string[],
  apiKey: string
): Promise<BatchSearchResult> => {
  console.log('Starting batch search for terms:', searchTerms);
  
  // Prepare the batch request
  const searchPromises = searchTerms.map(async (term) => {
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

      const product = data.data.products[0];
      return formatProduct(product);
    } catch (error) {
      console.error('Error in batch search for term:', term, error);
      return null;
    }
  });

  // Execute all searches in parallel
  console.log('Executing parallel batch search...');
  const results = await Promise.all(searchPromises);
  
  // Filter out failed searches and collect errors
  const products: AmazonProduct[] = [];
  const errors: string[] = [];
  
  results.forEach((result, index) => {
    if (result) {
      products.push(result);
    } else {
      errors.push(`Failed to find product for: ${searchTerms[index]}`);
    }
  });

  console.log('Batch search completed:', {
    successCount: products.length,
    errorCount: errors.length
  });

  return { products, errors };
};