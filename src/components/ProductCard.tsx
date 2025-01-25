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

  // Remove HTML tags and clean up
  let cleanTitle = decodedTitle
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();

  // Common patterns to remove
  const patternsToRemove = [
    /\([^)]*\)/g,                    // Remove parentheses and content
    /\[[^\]]*\]/g,                   // Remove brackets and content
    /\b\d{4}\b/g,                    // Remove 4-digit years
    /\b\d+(\.\d+)?\s*(ml|oz|inch|inches|ft|feet|cm|m|kg|lb|lbs|pack|piece|pieces)\b/gi, // Remove measurements
    /\b(with|for|by|in|of|and|the|a|an)\b/gi, // Remove common connecting words
    /\s*-\s*/g,                      // Remove hyphens with spaces
    /\s*\|\s*/g,                     // Remove pipes with spaces
    /\s*,\s*/g,                      // Remove commas with spaces
  ];

  patternsToRemove.forEach(pattern => {
    cleanTitle = cleanTitle.replace(pattern, ' ');
  });

  // Special cases for brand names (preserve them)
  const commonBrands = [
    'Harney & Sons',
    'Perky-Pet',
    'Celestron',
    // Add more brands as needed
  ];

  let finalTitle = cleanTitle;
  commonBrands.forEach(brand => {
    if (cleanTitle.toLowerCase().includes(brand.toLowerCase())) {
      const brandRegex = new RegExp(brand, 'i');
      const match = cleanTitle.match(brandRegex);
      if (match) {
        // Keep the brand name with original casing
        finalTitle = finalTitle.replace(brandRegex, match[0]);
      }
    }
  });

  // Handle special cases for product types
  const productTypes = {
    'bird feeder': (title: string) => {
      if (title.toLowerCase().includes('squirrel')) {
        return 'Anti-Squirrel Bird Feeder';
      }
      return 'Bird Feeder';
    },
    'binoculars': (title: string) => {
      const brandMatch = commonBrands.find(brand => 
        title.toLowerCase().includes(brand.toLowerCase())
      );
      return brandMatch ? `${brandMatch} Binoculars` : 'Binoculars';
    },
    'tea': (title: string) => {
      if (title.toLowerCase().includes('harney & sons')) {
        const teaType = title.toLowerCase().includes('black tea') ? 'Black Tea' :
                       title.toLowerCase().includes('green tea') ? 'Green Tea' :
                       title.toLowerCase().includes('herbal tea') ? 'Herbal Tea' : 'Tea';
        return `Harney & Sons ${teaType}`;
      }
      return 'Tea';
    }
  };

  // Apply special case handling
  for (const [type, handler] of Object.entries(productTypes)) {
    if (finalTitle.toLowerCase().includes(type)) {
      finalTitle = handler(finalTitle);
      break;
    }
  }

  // Clean up multiple spaces and trim
  finalTitle = finalTitle
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize properly (preserve acronyms)
  const words = finalTitle.split(' ');
  const processedWords = words.map((word, index) => {
    // Keep acronyms uppercase
    if (word.match(/^[A-Z0-9]+$/)) {
      return word;
    }
    // Keep brand names as is
    if (commonBrands.some(brand => 
      brand.toLowerCase().split(' ').includes(word.toLowerCase())
    )) {
      return word;
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
