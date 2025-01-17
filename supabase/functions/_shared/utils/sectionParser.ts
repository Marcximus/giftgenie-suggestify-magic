export const parseProductSection = (section: string) => {
  // Look for h3 tags, but ignore any after "conclusion" or "related gift ideas"
  if (section.toLowerCase().includes('conclusion') || 
      section.toLowerCase().includes('related gift ideas')) {
    return null;
  }

  const h3Match = section.match(/<h3>([^<]+)<\/h3>/);
  if (!h3Match) {
    return null;
  }
  
  const [fullMatch, productName] = h3Match;
  const [beforeH3, afterH3] = section.split(fullMatch);

  if (!beforeH3 || !afterH3) {
    console.warn('Could not split section content properly');
    return null;
  }

  return {
    beforeH3,
    afterH3,
    productName: productName.trim()
  };
};