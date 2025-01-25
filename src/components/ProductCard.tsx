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
}

export const simplifyTitle = (title: string): string => {
  // Decode HTML entities
  const doc = new DOMParser().parseFromString(title, 'text/html');
  const decodedTitle = doc.body.textContent || title;

  // Basic cleanup of HTML and extra spaces
  let cleanTitle = decodedTitle
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Remove marketplace prefixes but preserve brand names
  cleanTitle = cleanTitle
    .replace(/^(new|hot|2024|latest|best|premium)\s+/i, '')
    .trim();

  // Keep everything before "with", "for", or similar connecting words
  // but only if we have enough content before them
  const beforeConnector = cleanTitle.split(/\s+(?:with|for|featuring)\s+/i)[0];
  if (beforeConnector.split(' ').length >= 3) {
    cleanTitle = beforeConnector;
  }

  // Capitalize properly while preserving special cases
  const words = cleanTitle.split(' ').filter(word => word.length > 0);
  const processedWords = words.map((word, index) => {
    // Preserve exact cases for known brands and abbreviations
    if (word.includes('&') || // Preserve cases like "Harney & Sons"
        word.match(/^[A-Z0-9]+$/) || // Keep acronyms and product codes uppercase
        word.match(/^(?:iPhone|iPad|MacBook|AirPods|PlayStation|Xbox)/i) || // Keep product names
        word.match(/^(?:Wi-Fi|Bluetooth|USB-C|HDMI|LED|LCD)/i)) { // Keep technology terms
      return word;
    }

    // Special case for hyphenated words
    if (word.includes('-')) {
      return word.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-');
    }

    // Capitalize first word and significant words
    if (index === 0 || !['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'of', 'in', 'with'].includes(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    return word.toLowerCase();
  });

  return processedWords.join(' ');
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
  const simplifiedTitle = simplifyTitle(title);

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
