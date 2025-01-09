import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
      
      // If we have an ASIN, create a direct product link with the new format
      if (productAsin) {
        return `https://www.amazon.com/dp/${productAsin}/ref=nosim?tag=${cachedAssociateId}`;
      }
      
      // Fallback to search if no ASIN available
      const searchQuery = searchTerm.replace(/\s+/g, '+');
      return `https://www.amazon.com/s?k=${searchQuery}&tag=${cachedAssociateId}`;
    } catch (error) {
      console.error('Error getting Amazon Associate ID:', error);
      setIsLoading(false);
      
      // Even in error case, try to use ASIN if available
      if (productAsin) {
        return `https://www.amazon.com/dp/${productAsin}/ref=nosim`;
      }
      
      const searchQuery = title.replace(/\s+/g, '+');
      return `https://www.amazon.com/s?k=${searchQuery}`;
    }
  };

  const handleClick = async () => {
    const url = await getAmazonUrl(title, asin);
    // Open in new tab with noopener and noreferrer for security
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button 
      className="w-full bg-[#F97316] hover:bg-[#F97316]/90 shadow-sm text-sm py-1 transition-all duration-200" 
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "View on Amazon"}
    </Button>
  );
};