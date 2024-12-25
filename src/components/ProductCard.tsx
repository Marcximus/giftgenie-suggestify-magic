import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl: string;
}

export const ProductCard = ({ title, description, price, amazonUrl, imageUrl }: Product) => {
  return (
    <Card className="product-card">
      <CardHeader>
        <div className="aspect-square relative overflow-hidden rounded-lg">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            className="object-cover w-full h-full"
          />
        </div>
        <CardTitle className="text-lg mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
        <p className="text-lg font-bold mt-2">{price}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => window.open(amazonUrl, '_blank')}>
          View on Amazon
        </Button>
      </CardFooter>
    </Card>
  );
};