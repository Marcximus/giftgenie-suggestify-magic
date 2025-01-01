import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl?: string;
}

let cachedAssociateId: string | null = null;

export const ProductCard = ({ title, description, price, amazonUrl }: Product) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  const getAmazonUrl = async (searchTerm: string) => {
    try {
      if (!cachedAssociateId) {
        setIsLoading(true);
        const { data: { AMAZON_ASSOCIATE_ID } } = await supabase.functions.invoke('get-amazon-associate-id');
        cachedAssociateId = AMAZON_ASSOCIATE_ID;
        setIsLoading(false);
      }
      
      const searchQuery = searchTerm.replace(/\s+/g, '+');
      return `https://www.amazon.com/s?k=${searchQuery}&tag=${cachedAssociateId}`;
    } catch (error) {
      console.error('Error getting Amazon Associate ID:', error);
      setIsLoading(false);
      const searchQuery = title.replace(/\s+/g, '+');
      return `https://www.amazon.com/s?k=${searchQuery}`;
    }
  };

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
      // Return a default placeholder image
      return 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80';
    }
  };

  useEffect(() => {
    const getImage = async () => {
      // First try to find an image based on the title
      let url = await fetchPexelsImage(title);
      
      // If that fails, try using keywords from the description
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

  const handleClick = async () => {
    const url = await getAmazonUrl(title);
    window.open(url, '_blank');
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90">
      <CardHeader className="p-0">
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
        <CardTitle className="text-sm mt-2 px-3 line-clamp-2 min-h-[2.5rem] text-center group-hover:text-primary transition-colors duration-200">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <p className="text-muted-foreground text-[0.7rem] leading-relaxed line-clamp-3">{description}</p>
        <p className="text-sm font-bold mt-1 text-primary">{price}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button 
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm text-sm py-1 transition-all duration-200" 
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "View on Amazon"}
        </Button>
      </CardFooter>
    </Card>
  );
};