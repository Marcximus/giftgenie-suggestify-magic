import { ProductInfo } from '../types/ContentTypes.ts';
import { formatReviewData } from '../reviewUtils.ts';

const simplifyTitle = (title: string): string => {
  // Remove everything in parentheses
  let simplified = title.replace(/\([^)]*\)/g, '');
  // Remove everything after commas
  simplified = simplified.split(',')[0];
  // Limit to first 7 words
  simplified = simplified.split(' ').slice(0, 7).join(' ');
  return simplified.trim();
};

export const formatProductHtml = (
  product: ProductInfo,
  affiliateLink: string,
  beforeH3: string,
  afterH3: string
): string => {
  const simplifiedTitle = simplifyTitle(product.title);
  const reviewData = formatReviewData(product.rating, product.totalRatings);
  
  const reviewInfo = reviewData ? `
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

  return `${beforeH3}<h3>${simplifiedTitle}</h3>
    <div class="flex flex-col items-center my-8 sm:my-10">
      <div class="relative w-full max-w-2xl mb-6">
        <img 
          src="${product.imageUrl}" 
          alt="${simplifiedTitle}"
          class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
          loading="lazy"
        />
      </div>
      ${reviewInfo}
      <div class="product-actions flex flex-col items-center justify-center mt-4 mb-8">
        <a 
          href="${affiliateLink}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="amazon-button inline-flex items-center justify-center px-4 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-md transition-colors text-sm shadow-sm hover:shadow-md"
        >
          View on Amazon
        </a>
      </div>
    </div>${afterH3}`;
};