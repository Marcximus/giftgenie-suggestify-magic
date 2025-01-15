import { ProductInfo } from '../types/ContentTypes.ts';
import { formatReviewData } from '../reviewUtils.ts';

export const formatProductHtml = (
  product: ProductInfo,
  affiliateLink: string,
  beforeH3: string,
  afterH3: string
): string => {
  const reviewData = formatReviewData(product.rating, product.totalRatings);
  
  // Add review stars and rating display
  const reviewHtml = reviewData ? `
    <div class="flex flex-col items-center gap-2 my-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
      <div class="flex items-center gap-2">
        ${Array.from({ length: 5 }, (_, i) => 
          `<span class="text-yellow-400 text-xl">
            ${i < Math.floor(reviewData.rating) ? '★' : (i < reviewData.rating ? '★' : '☆')}
          </span>`
        ).join('')}
        <span class="font-semibold text-xl text-gray-800">${reviewData.rating.toFixed(1)}</span>
      </div>
      ${reviewData.totalRatings ? `
        <div class="text-base text-gray-600">
          Based on ${reviewData.totalRatings.toLocaleString()} verified customer reviews
        </div>
      ` : ''}
    </div>` : '';

  return `${beforeH3}</h3>
    <div class="flex flex-col items-center my-8 sm:my-10">
      <div class="relative w-full max-w-2xl mb-6">
        <img 
          src="${product.imageUrl}" 
          alt="${product.title}"
          class="w-full aspect-[16/9] object-cover rounded-lg shadow-md mx-auto" 
          loading="lazy"
        />
      </div>
      ${reviewHtml}
      <div class="mt-4">
        <a 
          href="${affiliateLink}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="amazon-button"
        >
          View on Amazon
        </a>
      </div>
    </div>${afterH3}`;
};