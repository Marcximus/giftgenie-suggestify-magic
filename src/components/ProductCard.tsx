import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

// Array of placeholder images from Unsplash with smaller sizes
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=300&q=70",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=300&q=70",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=70",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300&q=70",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=300&q=70"
];

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl: string;
}

// Cache for Amazon Associate ID
let cachedAssociateId: string | null = null;

export const ProductCard = ({ title, description, price, amazonUrl, imageUrl }: Product) => {
  const [isLoading, setIsLoading] = useState(false);

  // Get Amazon Associate ID from cache or fetch it
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

  const getRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDER_IMAGES.length);
    return PLACEHOLDER_IMAGES[randomIndex];
  };

  const handleClick = async () => {
    const url = await getAmazonUrl(title);
    window.open(url, '_blank');
  };

  return (
    <Card className="product-card">
      <CardHeader>
        <div className="aspect-square relative overflow-hidden rounded-lg">
          <img
            src={imageUrl || getRandomImage()}
            alt={title}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        </div>
        <CardTitle className="text-lg mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
        <p className="text-lg font-bold mt-2">{price}</p>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-primary hover:bg-primary/90" 
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "View on Amazon"}
        </Button>
      </CardFooter>
    </Card>
  );
};