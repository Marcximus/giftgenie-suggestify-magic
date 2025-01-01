import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductImageProps {
  title: string;
  description: string;
}

export const ProductImage = ({ title, description }: ProductImageProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  const cleanSearchTerm = (title: string) => {
    // Remove common words and specifications
    const cleanTitle = title
      .toLowerCase()
      .replace(/\b(the|with|for|and|or|in|on|at|to|of|from|by)\b/gi, '')
      .replace(/\d+(\.\d+)?(\s*)(inch|"|inches|ft|feet|mm|cm|m|gb|tb|mb|hz|watts)/gi, '')
      .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
      .replace(/[^\w\s]/g, ' ')  // Replace special characters with spaces
      .trim();

    // Get the main product type (usually the last 2-3 words)
    const words = cleanTitle.split(' ');
    return words.slice(-3).join(' ');
  };

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
      setImageError(true);
      return 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80';
    }
  };

  useEffect(() => {
    const getImage = async () => {
      const mainTerm = cleanSearchTerm(title);
      console.log('Main search term:', mainTerm);
      
      let url = await fetchGoogleImage(mainTerm);
      
      // If the first search fails, try with just the last word
      if (!url || imageError) {
        const fallbackTerm = title.split(' ').pop() || 'gift';
        console.log('Fallback search term:', fallbackTerm);
        url = await fetchGoogleImage(fallbackTerm);
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