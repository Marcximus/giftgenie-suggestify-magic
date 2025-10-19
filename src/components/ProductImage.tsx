
import { useState, useEffect, useRef } from 'react';
import { ProductImageProps } from './product-image/types';
import { 
  preloadImage, 
  loadingQueue, 
  preloadQueue, 
  MAX_CONCURRENT_LOADS 
} from './product-image/ImageLoaderContext';
import { 
  genericFallback, 
  getOptimizedImageUrl, 
  getTinyPlaceholder, 
  generateSrcSet 
} from './product-image/imageUtils';
import { 
  useFallbackImage, 
  FallbackImageSpinner 
} from './product-image/FallbackImage';
import { generateProductAltText } from '@/utils/altTextGenerator';

export const ProductImage = ({ title, imageUrl, product }: ProductImageProps) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const { isLoadingFallback, fetchGoogleImage } = useFallbackImage(
    title,
    genericFallback,
    setCurrentImageUrl
  );

  const handleImageError = async () => {
    setHasError(true);
    if (currentImageUrl !== genericFallback && title) {
      await fetchGoogleImage(title);
    } else {
      setCurrentImageUrl(genericFallback);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
    setHasError(false);
  };

  const handlePlaceholderLoad = () => {
    setPlaceholderLoaded(true);
  };

  useEffect(() => {
    if (!currentImageUrl) return;
    setImageLoaded(false);
    setIsLoading(true);

    // If we're already loading too many images, queue this one
    if (loadingQueue.size >= MAX_CONCURRENT_LOADS) {
      preloadQueue.push(currentImageUrl);
      return;
    }

    const loadImage = async () => {
      // Generate srcset for responsive images with higher quality
      const srcset = generateSrcSet(currentImageUrl);

      // Start preloading the image
      try {
        await preloadImage(getOptimizedImageUrl(currentImageUrl, 800));
        if (imageRef.current) {
          imageRef.current.srcset = srcset;
        }
      } catch (error) {
        handleImageError();
      }

      // Preload next size up for better responsive behavior
      const nextSizeUrl = getOptimizedImageUrl(currentImageUrl, 1200);
      if (!loadingQueue.has(nextSizeUrl)) {
        preloadQueue.push(nextSizeUrl);
      }
    };

    loadImage();

    // Cleanup function to remove from queues if component unmounts
    return () => {
      loadingQueue.delete(currentImageUrl);
      const index = preloadQueue.indexOf(currentImageUrl);
      if (index > -1) {
        preloadQueue.splice(index, 1);
      }
    };
  }, [currentImageUrl]);

  return (
    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
      {!imageLoaded && currentImageUrl && (
        <img
          src={getTinyPlaceholder(currentImageUrl)}
          alt=""
          className={`absolute inset-0 w-full h-full object-contain transform transition-opacity duration-300 ${
            placeholderLoaded ? 'blur-sm scale-105 opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
          loading="lazy"
          onLoad={handlePlaceholderLoad}
        />
      )}
      
      <img
        ref={imageRef}
        srcSet={currentImageUrl ? generateSrcSet(currentImageUrl) : undefined}
        sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
        src={currentImageUrl ? getOptimizedImageUrl(currentImageUrl, 800) : genericFallback}
        alt={product ? generateProductAltText(product) : `${title} gift idea`}
        className={`w-full h-full object-contain transition-all duration-500 ${
          !imageLoaded ? 'opacity-0' : 'opacity-100'
        } ${hasError ? 'opacity-0' : ''} group-hover:scale-105`}
        loading="lazy"
        decoding="async"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      
      {isLoadingFallback && <FallbackImageSpinner />}
      
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        aria-hidden="true"
      />
    </div>
  );
};
