interface ProductInfo {
  title: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  rating?: number;
  totalRatings?: number;
  description?: string;
}

export const formatProductHtml = (
  product: ProductInfo,
  affiliateLink: string
) => {
  // Add product image with updated dimensions (140x140px)
  const imageHtml = product.imageUrl ? `
    <div class="flex justify-center my-4">
      <img src="${product.imageUrl}" 
           alt="${product.title}" 
           class="rounded-lg shadow-md w-[140px] h-[140px] object-contain"
           loading="lazy" />
    </div>` : '';

  // Format price with currency
  const priceDisplay = product.price ? 
    `<p class="text-left text-sm text-muted-foreground mb-2">💰 Current price: ${product.currency} ${product.price}</p>` : '';
  
  // Format rating and review count
  const reviewInfo = product.rating ? 
    `<p class="text-left text-sm text-muted-foreground mb-4">
      ⭐ Rating: ${product.rating.toFixed(1)} out of 5 stars 
      ${product.totalRatings ? `(${product.totalRatings.toLocaleString()} reviews)` : ''}
    </p>` : '';

  // Add the custom description
  const descriptionHtml = product.description ? 
    `<p class="text-left text-sm md:text-base mb-4">${product.description}</p>` : '';

  return `
    <h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
      ${product.title}
    </h3>
    ${imageHtml}
    ${priceDisplay}
    ${reviewInfo}
    ${descriptionHtml}
    <div class="mt-4">
      <a href="${affiliateLink}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
        View on Amazon
      </a>
    </div>`;
};