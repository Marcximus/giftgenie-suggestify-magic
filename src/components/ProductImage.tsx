import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ProductImageProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export const ProductImage = ({ title, imageUrl }: ProductImageProps) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  
  // Generic fallback image for when all else fails
  const genericFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

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
    const target = event?.target as HTMLImageElement;
    
    // If we're not already showing the fallback and we have a title
    if (target.src !== genericFallback && title) {
      await fetchGoogleImage(title);
    } else {
      // If Google image also fails or we have no title, use generic fallback
      setCurrentImageUrl(genericFallback);
    }
  };

  return (
    <div className="aspect-[4/3] relative overflow-hidden">
      <img
        src={currentImageUrl || genericFallback}
        alt={`Product image of ${title}`}
        className={`object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ${
          isLoadingFallback ? 'opacity-50' : 'opacity-100'
        }`}
        loading="lazy"
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