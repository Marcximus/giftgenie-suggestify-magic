import { cleanSearchTerm, simplifySearchTerm } from './utils/textUtils.ts';
import { isLikelyAccessory, sortProductsByRelevance } from './utils/productUtils.ts';
import { detectAgeGroup, getCategoryId } from './utils/demographicUtils.ts';
import { getFallbackSearchTerms } from './utils/searchTermUtils.ts';

export { 
  cleanSearchTerm,
  simplifySearchTerm,
  getFallbackSearchTerms
};

export const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string,
  ageCategory?: string
) => {
  const cleanedTerm = cleanSearchTerm(term);
  const ageGroup = ageCategory || detectAgeGroup(term);
  console.log('Searching with cleaned term:', cleanedTerm, 'Age group:', ageGroup);

  const page = Math.floor(Math.random() * 3) + 1;

  const searchParams = new URLSearchParams({
    query: cleanedTerm,
    country: 'US',
    category_id: getCategoryId(ageGroup),
    sort_by: 'RELEVANCE',
    page: page.toString()
  });

  const searchResponse = await fetch(
    `https://${rapidApiHost}/search?${searchParams.toString()}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': rapidApiHost,
      }
    }
  );

  if (!searchResponse.ok) {
    if (searchResponse.status === 429) {
      throw new Error('rate limit exceeded');
    }
    throw new Error(`Amazon Search API error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  
  if (searchData.data?.products) {
    searchData.data.products = searchData.data.products
      .filter(product => !isLikelyAccessory(product.title));
    searchData.data.products = sortProductsByRelevance(searchData.data.products);
  }

  console.log('Search response data:', {
    title: searchData.data?.products?.[0]?.title,
    price: searchData.data?.products?.[0]?.price,
    totalResults: searchData.data?.products?.length || 0,
    ageGroup,
    categoryId: getCategoryId(ageGroup)
  });
  
  return searchData;
};