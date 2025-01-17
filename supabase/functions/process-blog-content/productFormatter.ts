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
    <div class="flex justify-center my-4">
      <img src="${product.imageUrl}" 
           alt="${simplifiedTitle}" 
           class="w-full aspect-[4/3] object-contain rounded-lg shadow-md max-w-2xl mx-auto" 
           loading="lazy" />
    </div>` : '';

  // Format price with currency
  const priceDisplay = product.price ? 
    `<p class="text-center text-sm text-muted-foreground mb-2">
      Current price: ${product.currency || 'USD'} ${product.price.toFixed(2)}
    </p>` : '';
  
  // Format rating and review count
  const reviewInfo = product.rating ? `
    <div class="flex flex-col items-center gap-2 mb-4">
      <div class="flex items-center gap-1">
        ${Array.from({ length: 5 }, (_, i) => 
          `<span class="text-yellow-400">
            ${i < Math.floor(product.rating!) ? '★' : '☆'}
          </span>`
        ).join('')}
        <span class="font-medium ml-1">${product.rating.toFixed(1)}</span>
      </div>
      ${product.totalRatings ? `
        <span class="text-sm text-gray-500">
          (${product.totalRatings.toLocaleString()} reviews)
        </span>
      ` : ''}
    </div>` : '';

  return `
    <h3 class="text-xl md:text-2xl font-semibold mt-8 mb-4 text-center">
      ${simplifiedTitle}
    </h3>
    ${imageHtml}
    <div class="flex flex-col items-center">
      ${reviewInfo}
      ${priceDisplay}
      <a href="${affiliateLink}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="inline-block px-6 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium rounded-md transition-colors text-sm text-center mb-6">
        View on Amazon
      </a>
    </div>`;
};