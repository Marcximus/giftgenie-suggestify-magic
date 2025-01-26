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
      
      // Validate ASIN format (10 characters alphanumeric)
      const isValidAsin = productAsin && /^[A-Z0-9]{10}$/.test(productAsin);
      
      if (isValidAsin) {
        console.log('Creating direct product link for ASIN:', productAsin);
        return `https://www.amazon.com/dp/${productAsin}/ref=nosim?tag=${cachedAssociateId}`;
      }
      
      // If no valid ASIN, show a toast and return null
      console.warn('No valid ASIN available for product:', searchTerm);
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

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers
    const url = await getAmazonUrl(title, asin);
    if (url) {
      // Open in new tab with noopener and noreferrer for security
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Button 
      className="bg-[#F97316] hover:bg-[#F97316]/90 shadow-sm text-sm py-1 transition-all duration-200" 
      onClick={handleClick}
      disabled={isLoading || !asin}
      aria-label={asin ? "View on Amazon" : "Product not available"}
    >
      {isLoading ? "Loading..." : "View on Amazon"}
    </Button>
  );
};