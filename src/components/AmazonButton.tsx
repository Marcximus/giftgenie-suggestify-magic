import { useEffect, useState } from "react";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { getAmazonAssociateId, buildAmazonUrl } from "@/utils/amazonLink";

interface AmazonButtonProps {
  title: string;
  asin?: string;
}

export const AmazonButton = ({ title, asin }: AmazonButtonProps) => {
  const [amazonUrl, setAmazonUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!asin) {
        setIsLoading(false);
        return;
      }

      try {
        const associateId = await getAmazonAssociateId();
        if (associateId) {
          const url = buildAmazonUrl(asin, associateId);
          setAmazonUrl(url);
        }
      } catch (error) {
        console.error('Error building Amazon URL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, [asin]);

  if (!asin || !amazonUrl) {
    return (
      <RainbowButton 
        className="shadow-sm text-sm py-1 h-auto" 
        disabled
        aria-label="Product not available"
      >
        Not Available
      </RainbowButton>
    );
  }

  return (
    <a 
      href={amazonUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-block"
    >
      <RainbowButton 
        className="shadow-sm text-sm py-1 h-auto w-full" 
        disabled={isLoading}
        aria-label="Check It Out"
      >
        {isLoading ? "Loading..." : "Check It Out"}
      </RainbowButton>
    </a>
  );
};