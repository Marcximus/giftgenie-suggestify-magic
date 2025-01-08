import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface AmazonButtonProps {
  title: string;
}

let cachedAssociateId: string | null = null;

export const AmazonButton = ({ title }: AmazonButtonProps) => {
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

  const handleClick = async () => {
    const url = await getAmazonUrl(title);
    window.open(url, '_blank');
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