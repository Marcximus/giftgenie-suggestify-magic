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
  // Simplify title to first 7 words
  const simplifiedTitle = product.title
    .split(' ')
    .slice(0, 7)
    .join(' ')
    .trim();

  console.log('Formatting product HTML:', {
    title: simplifiedTitle,
    price: product.price,
    currency: product.currency,
    rating: product.rating,
    totalRatings: product.totalRatings
  });

  // Add product image with responsive dimensions
  const imageHtml = product.imageUrl ? `
    <div class="flex justify-center my-8">
      <img src="${product.imageUrl}" 
           alt="${simplifiedTitle}" 
           class="w-72 sm:w-96 md:w-[500px] h-72 sm:h-96 md:h-[500px] object-contain rounded-lg shadow-md" 
           loading="lazy" />
    </div>` : '';

  // Format price with currency
  const priceDisplay = product.price ? 
    `<p class="text-left text-sm text-muted-foreground mb-4">
      💰 Current price: ${product.currency || 'USD'} ${product.price.toFixed(2)}
    </p>` : '';
  
  // Format rating and review count
  const reviewInfo = product.rating ? 
    `<p class="text-left text-sm text-muted-foreground mb-6">
      ⭐ ${product.rating.toFixed(1)} stars${product.totalRatings ? ` • ${product.totalRatings.toLocaleString()} reviews` : ''}
    </p>` : '';

  return `
    <h3 class="text-left text-lg md:text-xl font-semibold mt-16 mb-4">
      ${simplifiedTitle}
    </h3>
    ${imageHtml}
    ${priceDisplay}
    ${reviewInfo}
    <div class="mt-4 mb-8">
      <a href="${affiliateLink}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="amazon-button inline-block px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm">
        View on Amazon
      </a>
    </div>`;
};