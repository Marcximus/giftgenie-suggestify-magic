const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const simplifySearchTerm = (searchTerm: string): string => {
  // Remove specific model numbers, sizes, and colors from search term
  const genericSearchTerm = searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\b(?:edition|version|series)\b/gi, '') // Remove common suffixes
    .replace(/-.*$/, '') // Remove anything after a hyphen
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '') // Remove sizes
    .trim();

  return genericSearchTerm;
};

const detectGender = (searchTerm: string): string | null => {
  const maleTerms = ['male', 'man', 'boy', 'husband', 'boyfriend', 'father', 'dad', 'brother', 'uncle', 'grandfather', 'grandpa', 'his'];
  const femaleTerms = ['female', 'woman', 'girl', 'wife', 'girlfriend', 'mother', 'mom', 'sister', 'aunt', 'grandmother', 'grandma', 'her'];
  
  const words = searchTerm.toLowerCase().split(/\s+/);
  if (maleTerms.some(term => words.includes(term))) return 'male';
  if (femaleTerms.some(term => words.includes(term))) return 'female';
  return null;
};

const detectAgeGroup = (searchTerm: string): string => {
  if (searchTerm.match(/\b(?:15|16|17|18|19)\s*(?:-\s*\d+)?\s*years?\s*old\b/) || 
      searchTerm.includes('teen') || 
      searchTerm.includes('teenager')) {
    return 'teen';
  }
  if (searchTerm.match(/\b(?:0|1|2)\s*(?:-\s*\d+)?\s*years?\s*old\b/) || 
      searchTerm.includes('baby') || 
      searchTerm.includes('infant')) {
    return 'infant';
  }
  if (searchTerm.match(/\b(?:3|4|5|6|7|8|9|10|11|12|13|14)\s*(?:-\s*\d+)?\s*years?\s*old\b/) || 
      searchTerm.includes('child') || 
      searchTerm.includes('kid')) {
    return 'child';
  }
  return 'adult';
};

export const getFallbackSearchTerms = (searchTerm: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const gender = detectGender(searchTerm);
  const ageGroup = detectAgeGroup(searchTerm);
  const searchTerms = [];
  
  // Add gender and age-specific qualifiers
  const genderPrefix = gender === 'male' ? 'mens ' : gender === 'female' ? 'womens ' : '';
  const agePrefix = ageGroup === 'teen' ? 'teen ' : 
                   ageGroup === 'child' ? 'kids ' :
                   ageGroup === 'infant' ? 'baby ' : '';
  
  // Try with first six words
  if (words.length > 6) {
    searchTerms.push(genderPrefix + agePrefix + words.slice(0, 6).join(' '));
  }
  
  // Try with first three words
  if (words.length > 3) {
    searchTerms.push(genderPrefix + agePrefix + words.slice(0, 3).join(' '));
  }
  
  // Try with just the first word but maintain gender and age context
  if (words.length > 0) {
    const interests = ['gaming', 'sports', 'music', 'art', 'technology'];
    const interestWord = words.find(word => interests.includes(word.toLowerCase()));
    if (interestWord) {
      searchTerms.push(genderPrefix + agePrefix + interestWord);
    } else {
      searchTerms.push(genderPrefix + agePrefix + words[0]);
    }
  }
  
  console.log('Generated fallback search terms:', searchTerms);
  return searchTerms;
};

export const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string
) => {
  const cleanedTerm = cleanSearchTerm(term);
  const ageGroup = detectAgeGroup(term);
  console.log('Searching with cleaned term:', cleanedTerm, 'Age group:', ageGroup);

  // Add age-specific category to search
  const categoryId = ageGroup === 'teen' ? 'teen-gaming' : 
                    ageGroup === 'child' ? 'toys-games' :
                    ageGroup === 'infant' ? 'baby-products' : 'aps';

  const searchParams = new URLSearchParams({
    query: cleanedTerm,
    country: 'US',
    category_id: categoryId,
    sort_by: 'RELEVANCE'
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
  console.log('Search response data:', {
    title: searchData.data?.products?.[0]?.title,
    price: searchData.data?.products?.[0]?.price,
    totalResults: searchData.data?.products?.length || 0,
    ageGroup,
    categoryId
  });
  return searchData;
};