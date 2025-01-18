import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from './config.ts';
import type { AmazonProduct } from './types.ts';
import { extractPrice } from './priceUtils.ts';

const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const simplifySearchTerm = (searchTerm: string): string => {
  const genericSearchTerm = searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\b(?:edition|version|series)\b/gi, '') // Remove common suffixes
    .replace(/-.*$/, '') // Remove anything after a hyphen
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '') // Remove sizes
    .trim();

  return genericSearchTerm;
};

export const getFallbackSearchTerms = (searchTerm: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const searchTerms = [];
  
  if (words.length > 2) {
    searchTerms.push(words.slice(0, 3).join(' '));
    searchTerms.push([words[0], words[words.length - 1]].join(' '));
  } else {
    searchTerms.push(words.join(' '));
  }
  
  return [...new Set(searchTerms)];
};

const scoreProduct = (product: any, searchTerm: string): number => {
  let score = 0;
  const lowerTitle = product.title.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase();

  // Heavily penalize accessories and replacement parts
  const accessoryKeywords = [
    'replacement',
    'spare',
    'refill',
    'accessory',
    'accessories',
    'parts',
    'attachment',
    'filter',
    'blade',
    'cartridge'
  ];

  // Check if any accessory keywords are present
  if (accessoryKeywords.some(keyword => lowerTitle.includes(keyword))) {
    score -= 50;
  }

  // Boost score for exact match in title
  if (lowerTitle.includes(lowerSearchTerm)) {
    score += 30;
  }

  // Boost score for products that start with the search term
  if (lowerTitle.startsWith(lowerSearchTerm)) {
    score += 20;
  }

  // Boost products with ratings
  if (product.product_star_rating) {
    score += parseFloat(product.product_star_rating);
  }

  // Boost products with more reviews
  if (product.product_num_ratings) {
    score += Math.min(10, Math.log(parseInt(product.product_num_ratings)) / Math.log(10));
  }

  return score;
};

export const searchProducts = async (
  searchTerm: string,
  apiKey: string
): Promise<AmazonProduct | null> => {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    console.error('Invalid or missing search term:', searchTerm);
    throw new Error('Search term is required and must be a non-empty string');
  }

  console.log('Starting product search with term:', searchTerm);
  const cleanedTerm = cleanSearchTerm(searchTerm);
  console.log('Cleaned search term:', cleanedTerm);

  // Try with exact search term first
  let product = await trySearch(cleanedTerm, apiKey);
  if (product) return product;

  // Try with simplified search term
  const simplifiedTerm = simplifySearchTerm(cleanedTerm);
  console.log('Trying simplified term:', simplifiedTerm);
  product = await trySearch(simplifiedTerm, apiKey);
  if (product) return product;

  // Try fallback terms
  const fallbackTerms = getFallbackSearchTerms(cleanedTerm);
  console.log('Trying fallback terms:', fallbackTerms);
  
  for (const term of fallbackTerms) {
    product = await trySearch(term, apiKey);
    if (product) return product;
  }

  console.log('No products found after all attempts');
  return null;
};

const trySearch = async (
  term: string,
  apiKey: string
): Promise<AmazonProduct | null> => {
  try {
    const url = new URL(`https://${RAPIDAPI_HOST}/search`);
    url.searchParams.append('query', term);
    url.searchParams.append('country', 'US');
    url.searchParams.append('category_id', 'aps');

    console.log('Making API request to:', url.toString());
    console.log('API Key present:', !!apiKey);

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Search API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      if (response.status === 403) {
        throw new Error('API subscription error: Please check the RapidAPI subscription status');
      }

      throw new Error(`Amazon API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data, null, 2));

    if (!data.data?.products?.length) {
      console.log('No products found for term:', term);
      return null;
    }

    // Score and sort products
    const scoredProducts = data.data.products
      .filter((p: any) => p.asin) // Only consider products with ASIN
      .map((p: any) => ({
        product: p,
        score: scoreProduct(p, term)
      }))
      .sort((a: any, b: any) => b.score - a.score); // Sort by score descending

    console.log('Scored products:', scoredProducts.map((sp: any) => ({
      title: sp.product.title,
      score: sp.score
    })));

    if (scoredProducts.length === 0) {
      console.log('No suitable products found after scoring');
      return null;
    }

    // Use the highest-scored product
    const bestProduct = scoredProducts[0].product;
    console.log('Selected best product:', bestProduct.title, 'with score:', scoredProducts[0].score);

    return formatProduct(bestProduct);
  } catch (error) {
    console.error('Error in product search:', error);
    throw error;
  }
};

const formatProduct = (product: any): AmazonProduct => {
  console.log('Formatting product data:', {
    title: product.title,
    hasPrice: !!product.product_price,
    rawPrice: product.product_price,
    priceType: typeof product.product_price,
    hasImage: !!product.product_photo,
    hasAsin: !!product.asin
  });

  const price = extractPrice(product.product_price);
  
  console.log('Price extraction result:', {
    rawPrice: product.product_price,
    extractedPrice: price,
    wasExtracted: price !== undefined
  });

  return {
    title: product.title,
    description: product.product_description || product.title,
    price,
    currency: 'USD',
    imageUrl: product.product_photo || product.thumbnail,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
    asin: product.asin
  };
};