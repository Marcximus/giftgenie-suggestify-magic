
export const genericFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

export const getOptimizedImageUrl = (url: string, width: number) => {
  if (!url) return genericFallback;
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&q=95&auto=format&fit=crop`;
  }
  return url;
};

export const getTinyPlaceholder = (url: string) => {
  if (!url) return genericFallback;
  if (url.includes('unsplash.com')) {
    return `${url}&w=40&q=30&blur=2`;
  }
  return url;
};

export const generateSrcSet = (imageUrl: string) => {
  const sizes = [400, 800, 1200];
  return sizes
    .map(width => getOptimizedImageUrl(imageUrl, width))
    .map((url, index) => `${url} ${sizes[index]}w`)
    .join(', ');
};
