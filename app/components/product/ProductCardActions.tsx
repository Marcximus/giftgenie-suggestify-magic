import { AmazonButton } from "../AmazonButton";
import { Button } from "../ui/button";
import { Wand2 } from "lucide-react";

interface ProductCardActionsProps {
  title: string;
  asin?: string;
  onMoreLikeThis?: (title: string) => void;
}

export const ProductCardActions = ({ title, asin, onMoreLikeThis }: ProductCardActionsProps) => {
  return (
    <div className="p-3 sm:p-4 pt-0 flex flex-col gap-2 flex-none">
      <AmazonButton title={title} asin={asin} />
      {onMoreLikeThis && (
        <Button 
          variant="outline" 
          size="default"
          className="w-full text-xs sm:text-sm opacity-70 hover:opacity-100 min-h-[2.75rem] touch-manipulation"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onMoreLikeThis?.(title);
          }}
          aria-label={`Find more products similar to ${title}`}
        >
          <Wand2 className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
          More like this
        </Button>
      )}
    </div>
  );
};