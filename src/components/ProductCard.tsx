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

// Common brand name patterns that should be preserved
const brandPatterns = [
  'tree of life',
  'bed head',
  'purely inspired',
];

// Essential product descriptors that should be preserved
const productDescriptors = [
  'cleaning', 'protective', 'storage', 'carrying',
  'portable', 'professional', 'instant', 'digital',
  'wireless', 'bluetooth', 'rechargeable', 'waterproof'
];

// Core product types that should be preserved
const productTypes = [
  'kit', 'set', 'pack', 'bundle', 'system',
  'camera', 'printer', 'album', 'strap',
  'cream', 'serum', 'lotion', 'moisturizer', 'cleanser',
  'phone', 'tablet', 'laptop', 'watch', 'speaker',
  'book', 'guide', 'manual', 'collection',
];

// Marketing terms to remove
const marketingTerms = [
  'premium', 'luxury', 'high-end', 'ultimate', 'best',
  'perfect', 'amazing', 'incredible', 'exceptional',
  'superior', 'elite', 'deluxe', 'exclusive',
  'innovative', 'revolutionary', 'next-generation',
  'state-of-the-art', 'cutting-edge', 'top-of-the-line',
  'world-class', 'ultra', 'super', 'mega',
  'limited-edition', 'special-edition', 'new',
  'genuine', 'authentic', 'latest', 'upgraded',
  'enhanced', 'improved', 'advanced',
  '2nd', '3rd', '4th', '5th', 'ii', 'iii', 'iv'
];

const domParser = new DOMParser();
const modelNumberPattern = /\b[A-Z0-9]+-?[A-Z0-9]+\b/g;
const measurementPattern = /\b\d+(?:\.\d+)?(?:mm|MP|GB|TB|mAh|fps|inch|"|cm|m|kg|g|oz|ml|L|x|\d+['"])\b/gi;

export const simplifyTitle = (title: string): string => {
  // First decode any HTML entities
  const doc = domParser.parseFromString(title, 'text/html');
  let decodedTitle = doc.body.textContent || title;

  console.log('Original title:', decodedTitle);

  // Remove HTML tags and normalize spaces
  decodedTitle = decodedTitle
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Check for and preserve brand patterns
  let preservedBrand = '';
  for (const pattern of brandPatterns) {
    if (decodedTitle.toLowerCase().includes(pattern)) {
      preservedBrand = pattern;
      break;
    }
  }

  // Remove text in parentheses and brackets
  decodedTitle = decodedTitle
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();

  // Remove measurements while preserving essential product info
  decodedTitle = decodedTitle.replace(measurementPattern, '');

  // Split into words and process
  let words = decodedTitle.split(' ');
  
  // Preserve the first word if it's likely a brand name
  const brandName = words[0];
  
  // Remove model numbers while preserving brand names
  words = [brandName, ...words.slice(1).filter(word => !modelNumberPattern.test(word))];
  
  // Filter out marketing terms but preserve product descriptors
  words = words.filter(word => {
    const lowerWord = word.toLowerCase();
    const isMarketingTerm = marketingTerms.some(term => 
      lowerWord === term.toLowerCase()
    );
    const isDescriptor = productDescriptors.some(desc => 
      lowerWord === desc.toLowerCase()
    );
    const isProductType = productTypes.some(type => 
      lowerWord === type.toLowerCase()
    );
    
    return !isMarketingTerm || isDescriptor || isProductType;
  });

  // Remove common conjunctions and prepositions when not part of a brand name
  if (!preservedBrand) {
    words = words.filter(word => 
      !['with', 'and', 'in', 'for', 'by', 'or', 'to', 'the'].includes(word.toLowerCase())
    );
  }

  // Keep important descriptive words and product types
  words = words.filter((word, index) => {
    const lowerWord = word.toLowerCase();
    return (
      word.length > 1 && (
        index === 0 || // Keep brand name
        productDescriptors.includes(lowerWord) || // Keep descriptors
        productTypes.includes(lowerWord) || // Keep product types
        index < 4 // Keep first few words
      )
    );
  });

  // Reconstruct the title
  let finalTitle = words.join(' ');
  
  // If we preserved a brand pattern, make sure it's properly formatted
  if (preservedBrand && finalTitle.toLowerCase().includes(preservedBrand.toLowerCase())) {
    const brandRegex = new RegExp(preservedBrand, 'i');
    finalTitle = finalTitle.replace(brandRegex, preservedBrand);
  }

  console.log('Title transformation:', {
    original: title,
    simplified: finalTitle,
    preservedBrand,
    words
  });

  return finalTitle;
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
