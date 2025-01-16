export const formatProductHtml = (
  product: any,
  affiliateLink: string,
  beforeH3: string,
  afterH3: string
) => {
  const productSection = `
${beforeH3}
<h3>${product.title}</h3>

${afterH3}

<div class="flex justify-center">
  <img 
    src="${product.imageUrl}" 
    alt="${product.title}" 
    class="w-full max-w-lg mx-auto h-auto aspect-square object-contain rounded-lg shadow-md"
  />
</div>

<div class="flex justify-center">
  <a href="${affiliateLink}" class="amazon-button" target="_blank" rel="noopener noreferrer">
    View on Amazon
  </a>
</div>`;

  return productSection;
};