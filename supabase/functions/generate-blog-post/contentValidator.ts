export const validateContent = (content: string, title: string): boolean => {
  // Extract expected number of products from title
  const numberMatch = title.match(/(?:top\s+)?(\d+)\s+(?:best\s+)?/i);
  const expectedProducts = numberMatch ? parseInt(numberMatch[1]) : 8;

  // Count actual product sections (h3 tags)
  const productSections = (content.match(/<h3>/g) || []).length;

  console.log('Content validation:', {
    expectedProducts,
    actualProducts: productSections,
    title,
    contentLength: content.length,
    hasRequiredTags: {
      h3: content.includes('<h3>'),
      hr: content.includes('<hr class="my-8">'),
      ul: content.includes('<ul class="my-4">'),
      checkmark: content.includes('<li>✅')
    }
  });

  if (productSections !== expectedProducts) {
    console.error(`Invalid number of product sections. Expected ${expectedProducts}, got ${productSections}`);
    return false;
  }

  // Validate required HTML structure
  const requiredElements = [
    '<h3>',
    '<hr class="my-8">',
    '<ul class="my-4">',
    '<li>✅'
  ];

  const hasAllRequiredElements = requiredElements.every(element => content.includes(element));
  
  if (!hasAllRequiredElements) {
    console.error('Missing required HTML elements in content');
    return false;
  }

  // Validate emoji usage
  const hasEmojis = /[🎁⭐💝]/.test(content);
  if (!hasEmojis) {
    console.error('Missing required emojis in content');
    return false;
  }

  return true;
};