interface ValidationResult {
  isValid: boolean;
  errors: string[];
  wordCount?: number;
}

export const validateBlogContent = (content: string): ValidationResult => {
  const errors: string[] = [];
  
  // Remove HTML tags and calculate total word count
  const cleanContent = content.replace(/<[^>]*>/g, '');
  const totalWordCount = cleanContent.split(/\s+/).length;
  
  // Check for required sections
  if (!content.includes('<h1')) {
    errors.push('Missing main title (H1)');
  }
  
  // Count product sections (H3 tags)
  const productSections = content.match(/<h3[^>]*>.*?<\/h3>/g) || [];
  const productCount = productSections.length;
  if (productCount !== 10) {
    errors.push(`Found ${productCount} products, exactly 10 required`);
  }
  
  // Check word count requirements
  if (totalWordCount < 2000 || totalWordCount > 3500) {
    errors.push(`Total word count (${totalWordCount}) outside required range (2000-3500)`);
  }
  
  // Split content into sections and check individual word counts
  const sections = content.split('<hr class="my-8">');
  
  // Check introduction (first section)
  if (sections[0]) {
    const introClean = sections[0].replace(/<[^>]*>/g, '');
    const introWords = introClean.split(/\s+/).length;
    if (introWords < 200 || introWords > 300) {
      errors.push(`Introduction word count (${introWords}) outside required range (200-300)`);
    }
  }
  
  // Check product sections
  sections.slice(1, -1).forEach((section, index) => {
    const sectionClean = section.replace(/<[^>]*>/g, '');
    const sectionWords = sectionClean.split(/\s+/).length;
    if (sectionWords < 200 || sectionWords > 400) {
      errors.push(`Product section ${index + 1} word count (${sectionWords}) outside required range (200-400)`);
    }
  });
  
  // Check conclusion (last section)
  if (sections[sections.length - 1]) {
    const conclusionClean = sections[sections.length - 1].replace(/<[^>]*>/g, '');
    const conclusionWords = conclusionClean.split(/\s+/).length;
    if (conclusionWords < 200 || conclusionWords > 400) {
      errors.push(`Conclusion word count (${conclusionWords}) outside required range (200-400)`);
    }
  }
  
  // Check for proper emoji usage
  if (!content.includes('🎁') || !content.includes('⭐') || !content.includes('💝')) {
    errors.push('Missing required emoji indicators');
  }
  
  // Check for proper feature lists
  const featureLists = content.match(/<ul class="my-4">/g) || [];
  if (featureLists.length < productCount) {
    errors.push('Missing feature lists for some products');
  }
  
  // Check for duplicate categories
  const productTitles = new Set();
  productSections.forEach(title => {
    const cleanTitle = title.replace(/<\/?h3>/g, '').trim();
    if (productTitles.has(cleanTitle)) {
      errors.push(`Duplicate product title found: ${cleanTitle}`);
    }
    productTitles.add(cleanTitle);
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    wordCount: totalWordCount
  };
};