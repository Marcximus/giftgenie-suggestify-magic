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

// Marketing terms to remove for cleaner titles
const marketingTerms = [
  'premium', 'luxury', 'professional', 'high-end', 'ultimate', 'best',
  'perfect', 'amazing', 'incredible', 'exceptional', 'superior', 'elite',
  'deluxe', 'exclusive', 'advanced', 'innovative', 'revolutionary',
  'next-generation', 'state-of-the-art', 'cutting-edge', 'top-of-the-line',
  'world-class', 'ultra', 'super', 'mega', 'premium-quality', 'high-quality',
  'professional-grade', 'limited-edition', 'special-edition', 'new'
];

// Compile a regex pattern for marketing terms
const marketingTermsPattern = new RegExp(`\\b(${marketingTerms.join('|')})\\b`, 'gi');

export const simplifyTitle = (title: string): string => {
  // First decode any HTML entities
  const doc = new DOMParser().parseFromString(title, 'text/html');
  let decodedTitle = doc.body.textContent || title;

  // Remove HTML tags and normalize spaces
  decodedTitle = decodedTitle
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove marketing terms
  decodedTitle = decodedTitle.replace(marketingTermsPattern, '');

  // Remove text in parentheses
  decodedTitle = decodedTitle.replace(/\([^)]*\)/g, '');

  // Remove multiple spaces that might have been created
  decodedTitle = decodedTitle.replace(/\s+/g, ' ').trim();

  // Split into words and limit to 7 words
  const words = decodedTitle.split(' ');
  if (words.length > 7) {
    decodedTitle = words.slice(0, 7).join(' ');
  }

  // Ensure the title starts with a capital letter
  decodedTitle = decodedTitle.charAt(0).toUpperCase() + decodedTitle.slice(1);

  // Log the transformation for debugging
  console.log('Title transformation:', {
    original: title,
    simplified: decodedTitle
  });

  return decodedTitle;
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