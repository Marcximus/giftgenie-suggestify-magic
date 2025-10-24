
import { memo } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { ProductCardContent } from "./product/ProductCardContent";
import { ProductCardActions } from "./product/ProductCardActions";

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
  suggestion?: any;
}

const ProductCardComponent = ({ 
  title, 
  description, 
  price, 
  rating,
  totalRatings,
  asin,
  imageUrl,
  onMoreLikeThis,
  suggestion
}: ProductCardProps) => {
  // Memoize schema data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": title,
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

  const handleCardClick = async () => {
    if (!asin) return;
    
    try {
      const { data: { AMAZON_ASSOCIATE_ID } } = await import('@/integrations/supabase/client').then(m => 
        m.supabase.functions.invoke('get-amazon-associate-id')
      );
      
      const isValidAsin = asin && /^[A-Z0-9]{10}$/.test(asin);
      if (isValidAsin && AMAZON_ASSOCIATE_ID) {
        const url = `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${AMAZON_ASSOCIATE_ID}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening product link:', error);
    }
  };

  return (
    <Card 
      className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90 cursor-pointer"
      role="article"
      aria-label={`Product: ${title}`}
      onClick={handleCardClick}
    >
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <CardHeader className="p-0 flex-none">
        <ProductImage 
          title={title} 
          description={description} 
          imageUrl={imageUrl}
          product={suggestion || {
            title,
            description,
            priceRange: price,
            reason: description,
            amazon_rating: rating,
            amazon_total_ratings: totalRatings,
            amazon_asin: asin
          }}
        />
        <div className="h-[1.75rem] overflow-hidden mt-2 px-3 sm:px-4">
          <CardTitle className="text-sm sm:text-base truncate text-center group-hover:text-primary transition-colors duration-200">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      
      <ProductCardContent 
        title={title}
        description={description}
        price={price}
        rating={rating}
        totalRatings={totalRatings}
      />
      
      <ProductCardActions 
        title={title}
        asin={asin}
        onMoreLikeThis={onMoreLikeThis}
      />
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);
