interface BlogPostImageProps {
  imageUrl: string;
  title: string;
  reviewData?: {
    rating?: number;
    totalRatings?: number;
  };
}

export const BlogPostImage = ({ imageUrl, title, reviewData }: BlogPostImageProps) => {
  const styledImageClass = "w-full max-w-xl h-auto object-contain rounded-lg shadow-md mx-auto my-4";

  if (reviewData?.rating !== undefined && reviewData?.totalRatings !== undefined) {
    return `
      <div class="flex flex-col items-center my-6">
        <img src="${imageUrl}" alt="${title}" class="${styledImageClass}" />
        <div class="w-full max-w-xl mt-4">
          <div class="flex flex-col items-center gap-2 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
            <div class="flex items-center gap-2">
              ${Array.from({ length: 5 }, (_, i) => {
                const rating = reviewData.rating || 0;
                return `<span class="text-yellow-400 text-lg">
                  ${i < Math.floor(rating) ? '★' : (i < rating ? '★' : '☆')}
                </span>`;
              }).join('')}
              <span class="font-semibold text-lg text-gray-800">
                ${reviewData.rating.toFixed(1)}
              </span>
            </div>
            <div class="text-sm text-gray-600">
              Based on ${reviewData.totalRatings.toLocaleString()} verified customer reviews
            </div>
          </div>
        </div>
      </div>`;
  }

  return `<img src="${imageUrl}" alt="${title}" class="${styledImageClass}" />`;
};