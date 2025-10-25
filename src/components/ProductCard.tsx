
import { memo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { ProductCardContent } from "./product/ProductCardContent";
import { ProductCardActions } from "./product/ProductCardActions";
import { getAmazonAssociateId, buildAmazonUrl } from "@/utils/amazonLink";

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
  const [amazonUrl, setAmazonUrl] = useState('');

  useEffect(() => {
    const fetchUrl = async () => {
      if (!asin) return;
      const associateId = await getAmazonAssociateId();
      if (associateId) {
        setAmazonUrl(buildAmazonUrl(asin, associateId));
      }
    };
    fetchUrl();
  }, [asin]);

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

  return (
    <Card 
      className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90"
      role="article"
      aria-label={`Product: ${title}`}
    >
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <CardHeader className="p-0 flex-none">
        <ProductImage 
          title={title} 
          description={description} 
          imageUrl={imageUrl}
          amazonUrl={amazonUrl}
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
        <a 
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-[1.75rem] overflow-hidden mt-2 px-3 sm:px-4 block no-underline"
          onClick={(e) => !amazonUrl && e.preventDefault()}
        >
          <CardTitle className="text-sm sm:text-base truncate text-center group-hover:text-primary transition-colors duration-200">
            {title}
          </CardTitle>
        </a>
      </CardHeader>
      
      <ProductCardContent 
        title={title}
        description={description}
        price={price}
        rating={rating}
        totalRatings={totalRatings}
        amazonUrl={amazonUrl}
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
