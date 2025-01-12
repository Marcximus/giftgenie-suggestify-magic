interface ProductInfo {
  title: string;
  imageUrl?: string;
  price?: string;
  currency?: string;
  rating?: string;
  totalRatings?: string;
  description?: string;
}

const simplifyTitle = (title: string): string => {
  return title
    .split(' ')
    .slice(0, 6)
    .join(' ')
    .trim();
};

export const formatProductHtml = (
  product: ProductInfo,
  affiliateLink: string
) => {
  const imageHtml = product.imageUrl ? `
    <div class="flex justify-center my-4">
      <img src="${product.imageUrl}" 
           alt="${simplifyTitle(product.title)}" 
           class="rounded-lg shadow-md w-[140px] h-[140px] md:w-[60px] md:h-[60px] object-contain"
           loading="lazy" />
    </div>` : '';

  const priceDisplay = product.price ? 
    `<p class="text-left text-sm text-muted-foreground mb-2">💰 Current price: USD ${product.price}</p>` : '';
  
  const reviewInfo = product.rating ? 
    `<div class="flex items-center gap-1.5 text-left text-sm text-muted-foreground mb-4">
      <svg class="w-4 h-4 fill-yellow-400 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span>${product.rating} ${product.totalRatings ? `(${product.totalRatings})` : ''}</span>
    </div>` : '';

  return `
    <h3 class="text-left text-lg md:text-xl font-semibold mt-6 mb-3">
      ${simplifyTitle(product.title)}
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