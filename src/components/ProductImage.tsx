import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductImageProps {
  title: string;
  description: string;
}

export const ProductImage = ({ title, description }: ProductImageProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  const cleanSearchTerm = (term: string) => {
    // Remove common words and specifications that might confuse image search
    return term
      .replace(/\b(the|with|for|and|or|in|on|at|to|of|from|by)\b/gi, '')
      .replace(/\d+(\.\d+)?(\s*)(inch|"|inches|ft|feet|mm|cm|m|gb|tb|mb|hz|watts)/gi, '')
      .replace(/\([^)]*\)/g, '') // Remove parentheses and their contents
      .replace(/[^\w\s]/g, ' ')  // Replace special characters with spaces
      .trim();
  };

  const extractSearchTerms = (title: string, description: string) => {
    // Get the main product type from the title
    const cleanTitle = cleanSearchTerm(title);
    const mainProduct = cleanTitle.split(' ').slice(-2).join(' '); // Last two words often contain the product type

    // Extract key features from description
    const cleanDesc = cleanSearchTerm(description);
    const keywords = cleanDesc
      .split(' ')
      .filter(word => 
        word.length > 3 && 
        !word.includes('would') && 
        !word.includes('could') && 
        !word.includes('should')
      )
      .slice(0, 2)
      .join(' ');

    return `${mainProduct} product ${keywords}`.trim();
  };

  const fetchPexelsImage = async (searchTerm: string) => {
    try {
      console.log('Searching Pexels for:', searchTerm);
      
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
      // First try with the main product term
      const searchTerm = extractSearchTerms(title, description);
      let url = await fetchPexelsImage(searchTerm);
      
      // If that fails, try with just the product category
      if (!url || imageError) {
        const fallbackTerm = title.split(' ').pop() || 'gift'; // Use last word of title or 'gift'
        url = await fetchPexelsImage(fallbackTerm + ' product');
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