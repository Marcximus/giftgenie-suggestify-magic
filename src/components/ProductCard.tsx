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
  // Add more as needed
];

// Marketing terms to remove for cleaner titles
const marketingTerms = [
  'premium', 'luxury', 'professional', 'high-end', 'ultimate', 'best',
  'perfect', 'amazing', 'incredible', 'exceptional', 'superior', 'elite',
  'deluxe', 'exclusive', 'advanced', 'innovative', 'revolutionary',
  'next-generation', 'state-of-the-art', 'cutting-edge', 'top-of-the-line',
  'world-class', 'ultra', 'super', 'mega', 'premium-quality', 'high-quality',
  'professional-grade', 'limited-edition', 'special-edition', 'new', 'series',
  'genuine', 'authentic', 'compact', 'portable', 'wireless', 'digital',
  'generation', 'gen', 'ver', 'version', 'latest', 'upgraded', 'enhanced',
  'improved', 'advanced', '2nd', '3rd', '4th', '5th', 'ii', 'iii', 'iv'
];

// Product type indicators that should be preserved
const productTypes = [
  'camera', 'printer', 'album', 'set', 'kit', 'pack', 'bundle',
  'cream', 'serum', 'lotion', 'moisturizer', 'cleanser',
  'phone', 'tablet', 'laptop', 'watch', 'speaker',
  'book', 'guide', 'manual', 'collection',
];

// Create a single DOMParser instance
const domParser = new DOMParser();

// Compile patterns once
const marketingTermsPattern = new RegExp(`\\b(${marketingTerms.join('|')})\\b`, 'gi');
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
  
  // Remove marketing terms
  decodedTitle = words.join(' ').replace(marketingTermsPattern, '');

  // Remove common conjunctions and prepositions when not part of a brand name
  if (!preservedBrand) {
    decodedTitle = decodedTitle.replace(/\s+(with|and|in|for|by|or|of)\s+/gi, ' ');
  }

  // Split into words again for final processing
  words = decodedTitle.split(' ')
    .filter(word => word.length > 1) // Remove single characters
    .filter((word, index, array) => {
      // Keep words that are either:
      // 1. Part of a preserved brand name
      // 2. A known product type
      // 3. Among the first 3 words (likely brand/main product words)
      const isPartOfBrand = preservedBrand && preservedBrand.toLowerCase().includes(word.toLowerCase());
      const isProductType = productTypes.some(type => word.toLowerCase().includes(type.toLowerCase()));
      const isImportantPosition = index < 3;
      
      return isPartOfBrand || isProductType || isImportantPosition;
    })
    .slice(0, 5); // Limit to 5 words max

  // Reconstruct the title
  let finalTitle = words.join(' ');
  
  // If we preserved a brand pattern, make sure it's properly formatted
  if (preservedBrand && finalTitle.toLowerCase().includes(preservedBrand.toLowerCase())) {
    const brandRegex = new RegExp(preservedBrand, 'i');
    finalTitle = finalTitle.replace(brandRegex, preservedBrand);
  }

  // Ensure the title starts with a capital letter
  finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

  console.log('Title transformation:', {
    original: title,
    simplified: finalTitle,
    preservedBrand,
    steps: {
      afterDecoding: decodedTitle,
      afterParentheses: decodedTitle,
      finalWords: words
    }
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
