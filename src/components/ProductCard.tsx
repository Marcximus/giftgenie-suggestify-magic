import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { AmazonButton } from "./AmazonButton";

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl?: string;
}

export const ProductCard = ({ title, description, price }: Product) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90">
      <CardHeader className="p-0">
        <ProductImage title={title} description={description} />
        <CardTitle className="text-sm mt-2 px-3 line-clamp-2 min-h-[2.5rem] text-center group-hover:text-primary transition-colors duration-200">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <p className="text-muted-foreground text-[0.7rem] leading-relaxed line-clamp-3">{description}</p>
        <p className="text-sm font-bold mt-1 text-primary">{price}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <AmazonButton title={title} />
      </CardFooter>
    </Card>
  );
};