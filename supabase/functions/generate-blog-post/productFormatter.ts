interface ProductInfo {
  title: string;
  imageUrl?: string;
  price?: string;
  currency?: string;
  rating?: string;
  totalRatings?: string;
  description?: string;
}

export const formatProductHtml = (
  product: ProductInfo,
  affiliateLink: string
) => {
  // Simplify title to first 7 words
  const simplifiedTitle = product.title
    .split(' ')
    .slice(0, 7)
    .join(' ')
    .trim();

  // Add product image with responsive dimensions
  const imageHtml = product.imageUrl ? `
    <div class="flex justify-center my-12">
      <img src="${product.imageUrl}" 
           alt="${simplifiedTitle}" 
           class="w-72 sm:w-96 md:w-[500px] h-72 sm:h-96 md:h-[500px] object-contain rounded-lg shadow-md" 
           loading="lazy" />
    </div>` : '';

  // Format price (always in USD)
  const priceDisplay = product.price ? 
    `<p class="text-left text-sm text-muted-foreground mb-6">💰 Current price: USD ${product.price}</p>` : '';
  
  // Format rating and review count similar to main gift generator
  const reviewInfo = product.rating ? 
    `<p class="text-left text-sm text-muted-foreground mb-8">
      ⭐ ${product.rating} stars${product.totalRatings ? ` • ${product.totalRatings} reviews` : ''}
    </p>` : '';

  return `
    <h3 class="text-left text-lg md:text-xl font-semibold mt-16 mb-8">
      ${simplifiedTitle}
    </h3>
    ${imageHtml}
    ${priceDisplay}
    ${reviewInfo}
    <div class="mt-8 mb-12">
      <a href="${affiliateLink}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="amazon-button inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
        View on Amazon
      </a>
    </div>`;
};