import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductImageProps {
  title: string;
  description: string;
}

export const ProductImage = ({ title, description }: ProductImageProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  const fetchPexelsImage = async (searchTerm: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-pexels-image', {
        body: { searchTerm }
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image URL returned');

      return data.imageUrl;
    } catch (error) {
      console.error('Error fetching Pexels image:', error);
      setImageError(true);
      return 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80';
    }
  };

  useEffect(() => {
    const getImage = async () => {
      let url = await fetchPexelsImage(title);
      
      if (!url || imageError) {
        const keywords = description
          .split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3)
          .join(' ');
        url = await fetchPexelsImage(keywords);
      }
      
      setImageUrl(url);
    };

    getImage();
  }, [title, description]);

  return (
    <div className="aspect-[4/3] relative overflow-hidden">
      <img
        src={imageUrl}
        alt={title}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};