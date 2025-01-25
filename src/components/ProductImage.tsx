import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ProductImageProps {
  title: string;
  description: string;
  imageUrl?: string;
}

// Maintain a global queue of images being loaded
const loadingQueue = new Set<string>();
const preloadQueue: string[] = [];
const MAX_CONCURRENT_LOADS = 4;

const preloadImage = async (url: string): Promise<void> => {
  if (!url || loadingQueue.has(url)) return;
  
  try {
    loadingQueue.add(url);
    const img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  } finally {
    loadingQueue.delete(url);
    // Load next image in queue if any
    const nextUrl = preloadQueue.shift();
    if (nextUrl) preloadImage(nextUrl);
  }
};

export const ProductImage = ({ title, imageUrl }: ProductImageProps) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const genericFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

  const getOptimizedImageUrl = (url: string, width: number) => {
    if (!url) return genericFallback;
    if (url.includes('unsplash.com')) {
      return `${url}&w=${width}&q=80`;
    }
    return url;
  };

  const getTinyPlaceholder = (url: string) => {
    if (!url) return genericFallback;
    if (url.includes('unsplash.com')) {
      return `${url}&w=20&q=10&blur=5`;
    }
    return url;
  };

  const fetchGoogleImage = async (searchTerm: string) => {
    try {
      setIsLoadingFallback(true);
      const { data, error } = await supabase.functions.invoke('get-google-image', {
        body: { searchTerm }
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setCurrentImageUrl(data.imageUrl);
      } else {
        setCurrentImageUrl(genericFallback);
      }
    } catch (error) {
      console.error('Error fetching Google image:', error);
      setCurrentImageUrl(genericFallback);
    } finally {
      setIsLoadingFallback(false);
    }
  };

  const handleImageError = async () => {
    setHasError(true);
    if (currentImageUrl !== genericFallback && title) {
      await fetchGoogleImage(title);
    } else {
      setCurrentImageUrl(genericFallback);
    }
  };

  useEffect(() => {
    if (!currentImageUrl) return;

    // If we're already loading too many images, queue this one
    if (loadingQueue.size >= MAX_CONCURRENT_LOADS) {
      preloadQueue.push(currentImageUrl);
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      
      // Generate srcset for responsive images
      const sizes = [300, 600, 900];
      const srcset = sizes
        .map(width => getOptimizedImageUrl(currentImageUrl, width))
        .map((url, index) => `${url} ${sizes[index]}w`)
        .join(', ');

      // Start preloading the image
      try {
        await preloadImage(getOptimizedImageUrl(currentImageUrl, 600));
        if (imageRef.current) {
          imageRef.current.srcset = srcset;
        }
        setIsLoading(false);
        setHasError(false);
      } catch (error) {
        handleImageError();
      }

      // Preload next size up for better responsive behavior
      const nextSizeUrl = getOptimizedImageUrl(currentImageUrl, 900);
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
      {isLoading && currentImageUrl && (
        <img
          src={getTinyPlaceholder(currentImageUrl)}
          alt=""
          className="absolute inset-0 w-full h-full object-contain blur-lg scale-110 transform"
          aria-hidden="true"
          loading="lazy"
        />
      )}
      
      <img
        ref={imageRef}
        srcSet={currentImageUrl ? [300, 600, 900]
          .map(width => `${getOptimizedImageUrl(currentImageUrl, width)} ${width}w`)
          .join(', ') : undefined}
        sizes="(max-width: 640px) 300px, (max-width: 1024px) 600px, 900px"
        src={currentImageUrl ? getOptimizedImageUrl(currentImageUrl, 600) : genericFallback}
        alt={`Product image of ${title}`}
        className={`w-full h-full object-contain transition-all duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${hasError ? 'opacity-0' : ''} group-hover:scale-105`}
        loading="lazy"
        decoding="async"
        onError={handleImageError}
      />
      
      {isLoadingFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        aria-hidden="true"
      />
    </div>
  );
};