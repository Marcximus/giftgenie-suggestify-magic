interface ProductInfo {
  title: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  rating?: number;
  totalRatings?: number;
  description?: string;
  features?: string[];
}

export const formatProductHtml = (
  product: ProductInfo,
  affiliateLink: string
) => {
  // Format rating stars
  const formatStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => 
      `<span class="text-yellow-400 text-lg">
        ${i < Math.floor(rating) ? '★' : (i < rating ? '★' : '☆')}
      </span>`
    ).join('');
  };

  // Format review information
  const reviewInfo = product.rating ? `
    <div class="review-info">
      <div class="flex items-center justify-center gap-2">
        ${formatStars(product.rating)}
        <span class="font-semibold text-lg text-gray-800">${product.rating.toFixed(1)}</span>
      </div>
      ${product.totalRatings ? `
        <div class="text-base text-gray-600 text-center">
          Based on ${product.totalRatings.toLocaleString()} verified customer reviews
        </div>
      ` : ''}
    </div>` : '';

  // Format features list
  const featuresList = product.features?.length ? `
    <ul class="list-disc pl-6 space-y-2 my-4">
      ${product.features.map(feature => 
        `<li class="text-gray-700">${feature}</li>`
      ).join('')}
    </ul>
  ` : '';

  // Format price display
  const priceDisplay = product.price ? `
    <div class="text-center">
      <p class="text-lg font-bold text-primary">
        ${product.currency} ${product.price.toFixed(2)}
      </p>
    </div>
  ` : '';

  return `
    <div class="flex flex-col items-center my-8">
      <div class="relative w-full max-w-2xl mb-6">
        <img 
          src="${product.imageUrl}" 
          alt="${product.title}"
          class="w-full aspect-[4/3] object-contain rounded-lg shadow-md mx-auto" 
          loading="lazy"
        />
      </div>
      ${priceDisplay}
      ${reviewInfo}
      ${featuresList}
      <div class="product-actions">
        <a 
          href="${affiliateLink}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="amazon-button"
        >
          View on Amazon
        </a>
      </div>
    </div>`;
};