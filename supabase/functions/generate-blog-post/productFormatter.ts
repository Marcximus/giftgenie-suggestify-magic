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
    <div class="flex justify-center my-4">
      <img src="${product.imageUrl}" 
           alt="${simplifiedTitle}" 
           class="w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 object-contain rounded-lg shadow-md" 
           loading="lazy" />
    </div>` : '';

  // Format price (always in USD)
  const priceDisplay = product.price ? 
    `<p class="text-left text-sm text-muted-foreground mb-2">💰 Current price: USD ${product.price}</p>` : '';
  
  // Format rating and review count similar to main gift generator
  const reviewInfo = product.rating ? 
    `<p class="text-left text-sm text-muted-foreground mb-4">
      ⭐ ${product.rating} stars${product.totalRatings ? ` • ${product.totalRatings} reviews` : ''}
    </p>` : '';

  return `
    <h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
      ${simplifiedTitle}
    </h3>
    ${imageHtml}
    ${priceDisplay}
    ${reviewInfo}
    <div class="mt-4">
      <a href="${affiliateLink}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
        View on Amazon
      </a>
    </div>`;
};