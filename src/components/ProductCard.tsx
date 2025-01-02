import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { AmazonButton } from "./AmazonButton";
import { Button } from "./ui/button";
import { Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl?: string;
}

interface ProductCardProps extends Product {
  onMoreLikeThis?: (title: string) => void;
}

interface AmazonProduct {
  title: string;
  description: string;
  price: string;
  images: string[];
  asin: string;
  url: string;
}

export const ProductCard = ({ 
  title, 
  description, 
  price, 
  onMoreLikeThis 
}: ProductCardProps) => {
  const [amazonData, setAmazonData] = useState<AmazonProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAmazonData = async () => {
      if (retryCount >= 3) {
        console.log('Max retries reached for:', title);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching Amazon data for:', title);
        
        const { data, error } = await supabase.functions.invoke('get-amazon-product', {
          body: { searchQuery: title }
        });

        if (error) {
          console.error('Error fetching Amazon data:', error);
          if (error.status === 500) {
            setRetryCount(prev => prev + 1);
          }
          return;
        }

        if (!data || !data.title) {
          console.error('Invalid Amazon data received:', data);
          return;
        }

        console.log('Amazon data received:', data);
        setAmazonData(data);
      } catch (error) {
        console.error('Error in fetchAmazonData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmazonData();
  }, [title, retryCount]);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90">
      <CardHeader className="p-0">
        {amazonData?.images?.[0] ? (
          <div className="aspect-[4/3] relative overflow-hidden">
            <img
              src={amazonData.images[0]}
              alt={amazonData.title || title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <ProductImage title={title} description={description} />
        )}
        <CardTitle className="text-xs sm:text-sm mt-2 px-2 sm:px-3 line-clamp-2 min-h-[2.5rem] text-center group-hover:text-primary transition-colors duration-200">
          {amazonData?.title || title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 pt-1">
        <p className="text-[0.65rem] sm:text-[0.7rem] leading-relaxed line-clamp-3 text-muted-foreground">
          {amazonData?.description || description}
        </p>
        <p className="text-xs sm:text-sm font-bold mt-1 text-primary">
          {amazonData?.price || price}
        </p>
      </CardContent>
      <CardFooter className="p-2 sm:p-3 pt-0 flex flex-col gap-1.5">
        <AmazonButton 
          title={amazonData?.title || title} 
          asin={amazonData?.asin}
          url={amazonData?.url}
        />
        <Button 
          variant="outline" 
          size="sm"
          className="w-full text-[0.65rem] h-7 opacity-70 hover:opacity-100"
          onClick={() => onMoreLikeThis?.(amazonData?.title || title)}
        >
          <Wand2 className="w-2.5 h-2.5 mr-1" />
          More like this
        </Button>
      </CardFooter>
    </Card>
  );
};