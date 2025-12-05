
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface FallbackImageProps {
  title: string;
  onImageFound: (url: string) => void;
  genericFallback: string;
}

export const useFallbackImage = (
  title: string, 
  genericFallback: string,
  onImageUpdate: (url: string) => void
) => {
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);

  const fetchGoogleImage = async (searchTerm: string) => {
    try {
      setIsLoadingFallback(true);
      const { data, error } = await supabase.functions.invoke('get-google-image', {
        body: { searchTerm }
      });

      if (error) throw error;
      if (data?.imageUrl) {
        onImageUpdate(data.imageUrl);
      } else {
        onImageUpdate(genericFallback);
      }
    } catch (error) {
      console.error('Error fetching Google image:', error);
      onImageUpdate(genericFallback);
    } finally {
      setIsLoadingFallback(false);
    }
  };

  return {
    isLoadingFallback,
    fetchGoogleImage
  };
};

export const FallbackImageSpinner = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};
