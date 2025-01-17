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
  console.log('Formatting product HTML:', {
    title: product.title,
    hasImage: !!product.imageUrl,
    hasRating: !!product.rating,
    hasFeatures: product.features?.length || 0
  });

  // Format rating and review count
  const reviewInfo = product.rating ? `
    <div class="flex flex-col items-center gap-2 my-4">
      <div class="flex items-center gap-2">
        ${Array.from({ length: 5 }, (_, i) => 
          `<span class="text-yellow-400 text-xl">
            ${i < Math.floor(product.rating!) ? '★' : '☆'}
          </span>`
        ).join('')}
        <span class="font-semibold text-xl text-gray-800">${product.rating.toFixed(1)}</span>
        ${product.totalRatings ? `
          <span class="text-gray-500">
            (${product.totalRatings.toLocaleString()})
          </span>
        ` : ''}
      </div>
    </div>` : '';

  // Format features list if available
  const featuresList = product.features?.length ? `
    <ul class="my-4 list-disc pl-6 space-y-2">
      ${product.features.map(feature => 
        `<li class="text-gray-700">${feature}</li>`
      ).join('')}
    </ul>
  ` : '';

  // Format price if available
  const priceDisplay = product.price ? `
    <p class="text-lg font-bold text-primary mb-4">
      ${product.currency} ${product.price.toFixed(2)}
    </p>
  ` : '';

  return `
    <div class="flex flex-col items-center my-8">
      <div class="relative w-full max-w-2xl mb-6">
        <img 
          src="${product.imageUrl}" 
          alt="${product.title}"
          class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
          loading="lazy"
        />
      </div>
      ${priceDisplay}
      ${reviewInfo}
      ${featuresList}
      <div class="mt-4 mb-6">
        <a 
          href="${affiliateLink}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="inline-block px-6 py-3 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-lg transition-colors duration-200 text-center font-medium shadow-sm hover:shadow-md"
        >
          View on Amazon
        </a>
      </div>
    </div>`;
};