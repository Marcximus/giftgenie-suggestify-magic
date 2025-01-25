import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { ProductCardContent } from "./product/ProductCardContent";
import { ProductCardActions } from "./product/ProductCardActions";
import { supabase } from "@/integrations/supabase/client";
import { debounce } from "@/utils/debounce";

// Cache for simplified titles
const titleCache = new Map<string, string>();

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
  // Check cache first
  const cacheKey = `${title}-${description || ''}`;
  if (titleCache.has(cacheKey)) {
    console.log('Using cached title for:', title);
    return titleCache.get(cacheKey)!;
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-product-title', {
      body: { title, description }
    });

    if (error) {
      console.warn('Error simplifying title:', error);
      return title;
    }

    if (!data?.title) {
      console.warn('No title returned from API');
      return title;
    }

    // Cache the result
    titleCache.set(cacheKey, data.title);
    console.log('Cached simplified title for:', title);
    
    return data.title;
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
  const [simplifiedTitle, setSimplifiedTitle] = useState(() => {
    // Try to get from cache on initial render
    const cacheKey = `${title}-${description || ''}`;
    return titleCache.has(cacheKey) ? titleCache.get(cacheKey)! : title;
  });

  // Remove isProcessing state as it's causing unnecessary re-renders
  const updateTitle = useCallback(
    debounce(async (title: string, description?: string) => {
      try {
        const newTitle = await simplifyTitle(title, description);
        setSimplifiedTitle(newTitle);
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    }, 500),
    [] // Empty dependency array since the function doesn't depend on any props or state
  );

  // Effect to handle title updates
  useEffect(() => {
    const cacheKey = `${title}-${description || ''}`;
    if (titleCache.has(cacheKey)) {
      // If in cache, update synchronously
      setSimplifiedTitle(titleCache.get(cacheKey)!);
    } else {
      // If not in cache, trigger async update
      updateTitle(title, description);
    }

    return () => {
      updateTitle.cancel(); // Cancel any pending debounced calls
    };
  }, [title, description]); // Remove updateTitle from dependencies

  // Memoize schema data
  const schemaData = useMemo(() => ({
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
  }), [simplifiedTitle, description, imageUrl, price, asin, rating, totalRatings]);

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