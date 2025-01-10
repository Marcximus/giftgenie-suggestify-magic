import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface AmazonButtonProps {
  title: string;
  asin?: string;
}

let cachedAssociateId: string | null = null;

export const AmazonButton = ({ title, asin }: AmazonButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const getAmazonUrl = async (searchTerm: string, productAsin?: string) => {
    try {
      if (!cachedAssociateId) {
        setIsLoading(true);
        const { data: { AMAZON_ASSOCIATE_ID } } = await supabase.functions.invoke('get-amazon-associate-id');
        cachedAssociateId = AMAZON_ASSOCIATE_ID;
        setIsLoading(false);
      }
      
      // Only create a product link if we have a valid ASIN
      if (productAsin) {
        return `https://www.amazon.com/dp/${productAsin}/ref=nosim?tag=${cachedAssociateId}`;
      }
      
      // If no ASIN, show a toast and return null
      toast({
        title: "Product not found",
        description: "This product is currently unavailable on Amazon.",
        variant: "destructive",
      });
      return null;
      
    } catch (error) {
      console.error('Error getting Amazon Associate ID:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Unable to generate Amazon link. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleClick = async () => {
    const url = await getAmazonUrl(title, asin);
    if (url) {
      // Open in new tab with noopener and noreferrer for security
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Button 
      className="w-full bg-[#F97316] hover:bg-[#F97316]/90 shadow-sm text-sm py-1 transition-all duration-200" 
      onClick={handleClick}
      disabled={isLoading || !asin}
      aria-label={asin ? "View on Amazon" : "Product not available"}
    >
      {isLoading ? "Loading..." : "View on Amazon"}
    </Button>
  );
};