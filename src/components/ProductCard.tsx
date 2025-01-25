import { memo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { ProductCardContent } from "./product/ProductCardContent";
import { ProductCardActions } from "./product/ProductCardActions";
import { supabase } from "@/integrations/supabase/client";

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

export const simplifyTitle = async (title: string, description?: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-product-title', {
      body: { title, description }
    });

    if (error) {
      console.error('Error simplifying title:', error);
      return title;
    }

    return data.title || title;
  } catch (error) {
    console.error('Error in simplifyTitle:', error);
    return title;
  }
};

const ProductCardComponent = ({ 
  title, 
  description, 
  price, 
  rating,
  totalRatings,
  asin,
  imageUrl,
  onMoreLikeThis 
}: ProductCardProps) => {
  const [simplifiedTitle, setSimplifiedTitle] = useState(title);

  useEffect(() => {
    const updateTitle = async () => {
      const newTitle = await simplifyTitle(title, description);
      setSimplifiedTitle(newTitle);
    };
    updateTitle();
  }, [title, description]);

  // Prepare schema.org structured data for the product
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": simplifiedTitle,
    "description": description,
    "image": imageUrl,
    "offers": {
      "@type": "Offer",
      "price": typeof price === 'string' ? price.replace(/[^0-9.]/g, '') : price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": asin ? `https://www.amazon.com/dp/${asin}` : undefined
    },
    ...(rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "reviewCount": totalRatings || 0,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  };

  return (
    <Card 
      className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90"
      role="article"
      aria-label={`Product: ${simplifiedTitle}`}
    >
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <CardHeader className="p-0 flex-none">
        <ProductImage 
          title={simplifiedTitle} 
          description={description} 
          imageUrl={imageUrl} 
        />
        <div className="h-[1.75rem] overflow-hidden mt-2 px-3 sm:px-4">
          <CardTitle className="text-sm sm:text-base truncate text-center group-hover:text-primary transition-colors duration-200">
            {simplifiedTitle}
          </CardTitle>
        </div>
      </CardHeader>
      
      <ProductCardContent 
        description={description}
        price={price}
        rating={rating}
        totalRatings={totalRatings}
      />
      
      <ProductCardActions 
        title={simplifiedTitle}
        asin={asin}
        onMoreLikeThis={onMoreLikeThis}
      />
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);