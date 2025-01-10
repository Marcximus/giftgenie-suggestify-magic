import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ProductImageProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export const ProductImage = ({ title, imageUrl }: ProductImageProps) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Generic fallback image for when all else fails
  const genericFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

  // Generate a tiny placeholder version of the image
  const getTinyPlaceholder = (url: string) => {
    if (!url) return genericFallback;
    // Add blur and reduce quality for thumbnail
    return `${url}?auto=format&w=20&q=10&blur=5`;
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
    const target = event?.target as HTMLImageElement;
    
    // If we're not already showing the fallback and we have a title
    if (target.src !== genericFallback && title) {
      await fetchGoogleImage(title);
    } else {
      // If Google image also fails or we have no title, use generic fallback
      setCurrentImageUrl(genericFallback);
    }
  };

  // Preload the full resolution image
  useEffect(() => {
    if (currentImageUrl) {
      const img = new Image();
      img.src = currentImageUrl;
      img.onload = () => {
        setIsLoading(false);
      };
      img.onerror = () => {
        handleImageError();
      };
    }
  }, [currentImageUrl]);

  return (
    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
      {/* Blurred placeholder */}
      {isLoading && currentImageUrl && (
        <img
          src={getTinyPlaceholder(currentImageUrl)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transform"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        src={currentImageUrl || genericFallback}
        alt={`Product image of ${title}`}
        className={`object-cover w-full h-full group-hover:scale-110 transition-all duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${hasError ? 'opacity-0' : ''}`}
        loading="lazy"
        onError={handleImageError}
      />
      
      {/* Loading spinner */}
      {isLoadingFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Hover overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        aria-hidden="true"
      />
    </div>
  );
};