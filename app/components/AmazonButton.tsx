import { RainbowButton } from "@/components/ui/rainbow-button";
import { buildAmazonUrl } from "@/utils/amazonLink";

interface AmazonButtonProps {
  title: string;
  asin?: string;
}

export const AmazonButton = ({ title, asin }: AmazonButtonProps) => {
  const amazonUrl = asin ? buildAmazonUrl(asin) : '';

  if (!amazonUrl) {
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
        aria-label="Check It Out"
      >
        Check It Out
      </RainbowButton>
    </a>
  );
};