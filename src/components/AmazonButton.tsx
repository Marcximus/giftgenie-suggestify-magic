import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface AmazonButtonProps {
  title: string;
  asin?: string;
}

export const AmazonButton = ({ title, asin }: AmazonButtonProps) => {
  const [associateId, setAssociateId] = useState<string>('');

  useEffect(() => {
    const getAssociateId = async () => {
      const { data } = await supabase.functions.invoke('get-amazon-associate-id');
      if (data?.associateId) {
        setAssociateId(data.associateId);
      }
    };
    getAssociateId();
  }, []);

  const getAmazonUrl = () => {
    if (asin) {
      return `https://www.amazon.com/dp/${asin}${associateId ? `?tag=${associateId}` : ''}`;
    }
    const searchQuery = encodeURIComponent(title);
    return `https://www.amazon.com/s?k=${searchQuery}${associateId ? `&tag=${associateId}` : ''}`;
  };

  return (
    <Button
      variant="default"
      size="sm"
      className="w-full text-[0.65rem] h-7 bg-[#FF9900] hover:bg-[#FF9900]/90"
      onClick={() => window.open(getAmazonUrl(), '_blank')}
    >
      <ShoppingCart className="w-2.5 h-2.5 mr-1" />
      View on Amazon
    </Button>
  );
};