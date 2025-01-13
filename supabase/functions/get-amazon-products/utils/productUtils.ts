export const isLikelyAccessory = (title: string): boolean => {
  const accessoryKeywords = [
    'case', 'cover', 'screen protector', 'charger', 'cable',
    'adapter', 'mount', 'stand', 'holder', 'bag', 'pouch',
    'accessories', 'kit', 'replacement', 'spare', 'extra',
    'carrying case', 'protective', 'skin', 'shield'
  ];

  const lowerTitle = title.toLowerCase();
  return accessoryKeywords.some(keyword => 
    lowerTitle.includes(keyword) && 
    !lowerTitle.startsWith(keyword) // Allow if the keyword is the main product
  );
};

export const sortProductsByRelevance = (products: any[]) => {
  return products.sort((a, b) => {
    const aScore = (a.rating || 0) * Math.log(a.ratings_total || 1);
    const bScore = (b.rating || 0) * Math.log(b.ratings_total || 1);
    return bScore - aScore;
  });
};