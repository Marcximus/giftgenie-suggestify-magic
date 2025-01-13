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
  // Check for months first
  if (searchTerm.match(/\b(?:0|1|2|3|4|5|6|7|8|9|10|11|12)\s*months?\s*old\b/)) {
    return 'infant';
  }

  // Extract age from the search term
  const ageMatch = searchTerm.match(/\b(\d+)(?:\s*-\s*\d+)?\s*years?\s*old\b/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    
    if (age <= 2) return 'infant';
    if (age <= 7) return 'child';
    if (age <= 12) return 'preteen';
    if (age <= 20) return 'teen';
    if (age <= 30) return 'youngAdult';
    if (age <= 64) return 'adult';
    return 'senior';
  }

  // Check for age-related keywords
  if (searchTerm.includes('baby') || searchTerm.includes('infant') || searchTerm.includes('toddler')) {
    return 'infant';
  }
  if (searchTerm.match(/\b(?:kid|child|elementary)\b/)) {
    return 'child';
  }
  if (searchTerm.match(/\b(?:tween|preteen)\b/)) {
    return 'preteen';
  }
  if (searchTerm.match(/\b(?:teen|teenager|adolescent)\b/)) {
    return 'teen';
  }
  if (searchTerm.match(/\b(?:college|university|young\s*adult|twenties)\b/)) {
    return 'youngAdult';
  }
  if (searchTerm.match(/\b(?:senior|elderly|retired|retirement)\b/)) {
    return 'senior';
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
  const agePrefix = ageGroup === 'infant' ? 'baby ' :
                   ageGroup === 'child' ? 'kids ' :
                   ageGroup === 'preteen' ? 'tween ' :
                   ageGroup === 'teen' ? 'teen ' :
                   ageGroup === 'youngAdult' ? 'young adult ' :
                   ageGroup === 'senior' ? 'senior ' : '';
  
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
    const interests = ['gaming', 'sports', 'music', 'art', 'technology', 'reading', 'crafts', 'cooking'];
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

  // Map age groups to appropriate Amazon categories
  const categoryId = ageGroup === 'infant' ? 'baby-products' :
                    ageGroup === 'child' ? 'toys-games' :
                    ageGroup === 'preteen' ? 'toys-games' :
                    ageGroup === 'teen' ? 'teen-gaming' :
                    ageGroup === 'youngAdult' ? 'young-adult' :
                    ageGroup === 'senior' ? 'health-personal-care' : 'aps';

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