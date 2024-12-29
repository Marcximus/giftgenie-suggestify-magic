import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

// Array of placeholder images from Unsplash
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
];

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl: string;
}

export const ProductCard = ({ title, description, price, amazonUrl, imageUrl }: Product) => {
  // Get Amazon Associate ID from environment
  const getAmazonUrl = async (searchTerm: string) => {
    try {
      const { data: { AMAZON_ASSOCIATE_ID } } = await supabase.functions.invoke('get-amazon-associate-id');
      // Create a search-friendly URL by replacing spaces with plus signs
      const searchQuery = searchTerm.replace(/\s+/g, '+');
      return `https://www.amazon.com/s?k=${searchQuery}&tag=${AMAZON_ASSOCIATE_ID}`;
    } catch (error) {
      console.error('Error getting Amazon Associate ID:', error);
      // Fallback to basic search URL if there's an error
      const searchQuery = title.replace(/\s+/g, '+');
      return `https://www.amazon.com/s?k=${searchQuery}`;
    }
  };

  // Get a random placeholder image
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
        >
          View on Amazon
        </Button>
      </CardFooter>
    </Card>
  );
};