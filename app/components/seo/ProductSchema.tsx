import Script from 'next/script';

export interface ProductItem {
  name: string;
  description: string;
  image?: string;
  url?: string;
  price?: string;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: {
    value: number;
    count: number;
  };
}

interface ProductSchemaProps {
  products: ProductItem[];
}

/**
 * Product Schema component for SEO rich snippets
 * Helps product recommendations appear in Google Shopping and rich results
 *
 * Usage:
 * <ProductSchema products={[
 *   {
 *     name: "Personalized Star Map",
 *     description: "Custom star map showing the night sky...",
 *     image: "https://...",
 *     url: "https://amazon.com/...",
 *     price: "49.99",
 *     priceCurrency: "USD",
 *     availability: "InStock",
 *     rating: { value: 4.5, count: 1250 }
 *   }
 * ]} />
 */
export function ProductSchema({ products }: ProductSchemaProps) {
  if (!products || products.length === 0) {
    return null;
  }

  // If single product, use Product schema
  if (products.length === 1) {
    const product = products[0];
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      ...(product.image && { "image": product.image }),
      ...(product.url && { "url": product.url }),
      ...(product.price && {
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": product.priceCurrency || "USD",
          "availability": `https://schema.org/${product.availability || 'InStock'}`,
          ...(product.url && { "url": product.url })
        }
      }),
      ...(product.rating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating.value.toString(),
          "reviewCount": product.rating.count.toString()
        }
      })
    };

    return (
      <Script
        id="product-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    );
  }

  // If multiple products, use ItemList schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        ...(product.image && { "image": product.image }),
        ...(product.url && { "url": product.url }),
        ...(product.price && {
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": product.priceCurrency || "USD",
            "availability": `https://schema.org/${product.availability || 'InStock'}`,
            ...(product.url && { "url": product.url })
          }
        }),
        ...(product.rating && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating.value.toString(),
            "reviewCount": product.rating.count.toString()
          }
        })
      }
    }))
  };

  return (
    <Script
      id="product-list-schema"
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
    />
  );
}
