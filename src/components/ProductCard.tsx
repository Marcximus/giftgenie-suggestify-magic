import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const PLACEHOLDER_IMAGES = {
  tech: [
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=300&q=80", // laptop
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=80", // tech desk
  ],
  lifestyle: [
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80", // cozy lifestyle
    "https://images.unsplash.com/photo-1577003833619-76bbd7f82948?auto=format&fit=crop&w=300&q=80", // lifestyle items
  ],
  hobby: [
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80", // hobby related
    "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=300&q=80", // creative space
  ],
  generic: [
    "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80", // general gift
  ]
};

const CATEGORY_KEYWORDS = {
  tech: ['gadget', 'electronic', 'digital', 'smart', 'device', 'tech', 'computer', 'phone', 'tablet', 'watch'],
  lifestyle: ['fashion', 'clothing', 'accessory', 'jewelry', 'beauty', 'style', 'wear', 'dress', 'outfit'],
  hobby: ['craft', 'art', 'sport', 'game', 'book', 'read', 'music', 'instrument', 'hobby', 'collect'],
};

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

  const getCategoryFromText = (text: string): 'tech' | 'lifestyle' | 'hobby' | 'generic' => {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category as 'tech' | 'lifestyle' | 'hobby';
      }
    }
    
    return 'generic';
  };

  const getRelevantImage = () => {
    const category = getCategoryFromText(title + ' ' + description);
    const images = PLACEHOLDER_IMAGES[category];
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  };

  const handleClick = async () => {
    const url = await getAmazonUrl(title);
    window.open(url, '_blank');
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20">
      <CardHeader className="p-0">
        <div className="aspect-square relative overflow-hidden">
          <img
            src={getRelevantImage()}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <CardTitle className="text-lg mt-6 px-6">{title}</CardTitle>
      </CardHeader>
      <CardContent className="mt-2">
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        <p className="text-lg font-bold mt-4 text-primary">{price}</p>
      </CardContent>
      <CardFooter className="pb-6">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 shadow-sm" 
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "View on Amazon"}
        </Button>
      </CardFooter>
    </Card>
  );
};