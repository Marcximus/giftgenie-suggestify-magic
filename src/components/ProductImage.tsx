import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProductImageProps {
  title: string;
  description: string;
}

export const ProductImage = ({ title, description }: ProductImageProps) => {
  const [imageError, setImageError] = useState(false);

  const cleanSearchTerm = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/\b(the|with|for|and|or|in|on|at|to|of|from|by)\b/gi, '')
      .replace(/\d+(\.\d+)?(\s*)(inch|"|inches|ft|feet|mm|cm|m|gb|tb|mb|hz|watts)/gi, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/[^\w\s]/g, ' ')
      .trim();
  }, []);

  const fetchGoogleImage = async (searchTerm: string) => {
    try {
      console.log('Searching Google Images for:', searchTerm);
      
      const { data, error } = await supabase.functions.invoke('get-google-image', {
        body: { searchTerm }
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image URL returned');

      return data.imageUrl;
    } catch (error) {
      console.error('Error fetching Google image:', error);
      throw error;
    }
  };

  const { data: imageUrl, isError } = useQuery({
    queryKey: ['productImage', title],
    queryFn: async () => {
      const cleanedTitle = cleanSearchTerm(title);
      try {
        return await fetchGoogleImage(cleanedTitle);
      } catch (error) {
        // Fallback to first three words if full title fails
        const words = cleanedTitle.split(' ');
        const shortTitle = words.slice(0, 3).join(' ');
        return await fetchGoogleImage(shortTitle);
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  useEffect(() => {
    if (isError) {
      setImageError(true);
    }
  }, [isError]);

  const fallbackImage = 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="aspect-[4/3] relative overflow-hidden bg-muted/10">
      <img
        src={imageError ? fallbackImage : imageUrl}
        alt={title}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};