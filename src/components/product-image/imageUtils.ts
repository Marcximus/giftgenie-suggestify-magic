
export const genericFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=95';

export const getOptimizedImageUrl = (url: string, width: number) => {
  if (!url) return genericFallback;
  
  // Handle Unsplash images
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&q=95&auto=format&fit=crop`;
  }
  
  // Handle Amazon images
  if (url.includes('amazon.com') || url.includes('media-amazon.com')) {
    // Remove any existing size parameters
    const cleanUrl = url.replace(/._[^.]+_\.(jpg|png|webp)/i, '.$1');
    
    // Add high quality parameter if not already present
    if (cleanUrl.includes('.jpg') && !cleanUrl.includes('._SL')) {
      return cleanUrl.replace('.jpg', `._SL${width}_.jpg`);
    }
    
    if (cleanUrl.includes('.png') && !cleanUrl.includes('._SL')) {
      return cleanUrl.replace('.png', `._SL${width}_.png`);
    }
    
    return cleanUrl;
  }
  
  // Handle general images from other sources
  return url;
};

export const getTinyPlaceholder = (url: string) => {
  if (!url) return genericFallback;
  
  if (url.includes('unsplash.com')) {
    return `${url}&w=60&q=30&blur=5`;
  }
  
  // For other images, return the original - the blur will be applied via CSS
  return url;
};

export const generateSrcSet = (imageUrl: string) => {
  if (!imageUrl) return '';
  
  const sizes = [400, 800, 1200, 1600];
  return sizes
    .map(width => `${getOptimizedImageUrl(imageUrl, width)} ${width}w`)
    .join(', ');
};
