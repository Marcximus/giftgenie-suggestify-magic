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
  // Simplify title to first 7 words
  const simplifiedTitle = product.title
    .split(' ')
    .slice(0, 7)
    .join(' ')
    .trim();

  console.log('Formatting product HTML:', {
    title: simplifiedTitle,
    hasImage: !!product.imageUrl,
    hasRating: !!product.rating,
    hasFeatures: product.features?.length || 0
  });

  // Format rating and review count
  const reviewInfo = product.rating ? `
    <div class="flex flex-col items-center gap-2 my-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
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

  return `
    <div class="flex flex-col items-center my-8">
      <div class="w-full max-w-2xl mb-6">
        <img 
          src="${product.imageUrl}" 
          alt="${simplifiedTitle}"
          class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
          loading="lazy"
        />
      </div>
      ${reviewInfo}
      <div class="mt-4 mb-6">
        <a 
          href="${affiliateLink}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="inline-block px-6 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium rounded-md transition-colors text-sm text-center"
        >
          View on Amazon
        </a>
      </div>
      ${featuresList}
    </div>`;
};