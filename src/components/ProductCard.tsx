import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { AmazonButton } from "./AmazonButton";
import { Button } from "./ui/button";
import { Wand2, Star } from "lucide-react";

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  asin?: string;
}

interface ProductCardProps extends Product {
  onMoreLikeThis?: (title: string) => void;
}

export const ProductCard = ({ 
  title, 
  description, 
  price, 
  rating,
  totalRatings,
  asin,
  imageUrl,
  onMoreLikeThis 
}: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90">
      <CardHeader className="p-0">
        <ProductImage title={title} description={description} imageUrl={imageUrl} />
        <CardTitle className="text-xs sm:text-sm mt-2 px-2 sm:px-3 line-clamp-2 min-h-[2.5rem] text-center group-hover:text-primary transition-colors duration-200">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 pt-1">
        <p className="text-[0.65rem] sm:text-[0.7rem] leading-relaxed line-clamp-3 text-muted-foreground">
          {description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-primary">USD {price}</p>
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {rating.toFixed(1)} ({totalRatings?.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-2 sm:p-3 pt-0 flex flex-col gap-1.5">
        <AmazonButton title={title} asin={asin} />
        <Button 
          variant="outline" 
          size="sm"
          className="w-full text-[0.65rem] h-7 opacity-70 hover:opacity-100"
          onClick={() => onMoreLikeThis?.(title)}
        >
          <Wand2 className="w-2.5 h-2.5 mr-1" />
          More like this
        </Button>
      </CardFooter>
    </Card>
  );
};