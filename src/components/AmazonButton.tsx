import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface AmazonButtonProps {
  title: string;
  asin?: string;
  url?: string;
}

export const AmazonButton = ({ title, asin, url }: AmazonButtonProps) => {
  const [associateId, setAssociateId] = useState<string | null>(null);

  useEffect(() => {
    const getAssociateId = async () => {
      const { data, error } = await supabase.functions.invoke('get-amazon-associate-id');
      if (!error && data?.associateId) {
        setAssociateId(data.associateId);
      }
    };
    getAssociateId();
  }, []);

  const handleClick = () => {
    const baseUrl = url || (asin ? `https://www.amazon.com/dp/${asin}` : `https://www.amazon.com/s?k=${encodeURIComponent(title)}`);
    const finalUrl = associateId ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}tag=${associateId}` : baseUrl;
    window.open(finalUrl, '_blank');
  };

  return (
    <Button 
      onClick={handleClick}
      size="sm"
      className="w-full text-[0.65rem] h-7 bg-[#FF9900] hover:bg-[#FF9900]/90"
    >
      <ShoppingCart className="w-2.5 h-2.5 mr-1" />
      View on Amazon
    </Button>
  );
};