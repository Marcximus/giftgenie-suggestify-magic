# SEO Schema Components

Reusable components for adding structured data (Schema.org) to pages for better SEO and rich snippets in search results.

## Components

### FAQSchema

Adds FAQ structured data for rich snippets in Google Search results.

**Benefits:**
- Appears in Google's FAQ rich results
- Increases click-through rates
- Provides direct answers in search results
- Zero-click information for users

**Usage:**

```tsx
import { FAQSchema } from '@/components/seo/FAQSchema';

export default function BlogPost() {
  const faqs = [
    {
      question: "What are the best Christmas gifts for wives?",
      answer: "The best Christmas gifts for wives depend on her interests, but popular options include personalized jewelry, luxury spa experiences, smart home devices, and thoughtful keepsakes that show you know her well."
    },
    {
      question: "How much should I spend on a Christmas gift for my wife?",
      answer: "There's no set amount - it depends on your budget and relationship. Thoughtfulness matters more than price. You can find meaningful gifts ranging from $20 to $500+. The average person spends $50-$150 on their spouse's Christmas gift."
    },
    {
      question: "When should I start shopping for Christmas gifts?",
      answer: "Start shopping 4-6 weeks before Christmas (early to mid-November) to avoid shipping delays, sold-out items, and last-minute stress. This also gives you time to find the perfect gift and compare prices."
    }
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      {/* Your page content */}
    </>
  );
}
```

**Best Practices:**
- Keep answers concise (2-3 sentences max)
- Answer real questions people search for
- Use natural language
- Include 3-5 FAQs per page (not too many)
- Make answers helpful and complete

### ProductSchema

Adds Product structured data for gift recommendations to appear in Google Shopping and product rich results.

**Benefits:**
- Appears in Google Shopping results
- Shows ratings, prices, and availability
- Increases product visibility
- Better CTR on search results

**Usage - Single Product:**

```tsx
import { ProductSchema } from '@/components/seo/ProductSchema';

export default function ProductPage() {
  const product = {
    name: "Personalized Star Map Print",
    description: "Custom star map showing the night sky on a special date - perfect for anniversaries, weddings, or birthdays",
    image: "https://example.com/star-map.jpg",
    url: "https://amazon.com/dp/B08XYZ",
    price: "49.99",
    priceCurrency: "USD",
    availability: "InStock",
    rating: {
      value: 4.8,
      count: 1250
    }
  };

  return (
    <>
      <ProductSchema products={[product]} />
      {/* Your page content */}
    </>
  );
}
```

**Usage - Product List (Top 10 Gifts):**

```tsx
import { ProductSchema } from '@/components/seo/ProductSchema';

export default function GiftGuide() {
  const products = [
    {
      name: "Personalized Star Map",
      description: "Custom star map for special dates",
      image: "https://m.media-amazon.com/images/I/...",
      url: "https://amazon.com/dp/...",
      price: "49.99",
      priceCurrency: "USD",
      availability: "InStock",
      rating: { value: 4.8, count: 1250 }
    },
    {
      name: "Luxury Silk Pajama Set",
      description: "Premium silk pajamas for ultimate comfort",
      price: "89.99",
      priceCurrency: "USD",
      availability: "InStock"
    },
    // ... more products
  ];

  return (
    <>
      <ProductSchema products={products} />
      {/* Your page content */}
    </>
  );
}
```

**Best Practices:**
- Include accurate pricing (update regularly)
- Add high-quality product images
- Use real Amazon/product URLs
- Include ratings if available
- Keep descriptions concise but descriptive
- Update availability status
- Use for actual product recommendations (not generic gift ideas)

## How to Add to Existing Blog Posts

### Step 1: Identify Pages to Enhance

Priority pages for schema markup:
1. Top 10 gift guides (high traffic)
2. Product recommendation pages
3. Holiday gift guides
4. FAQ/how-to guides

### Step 2: Add FAQs to Gift Guides

For each "Top 10" blog post, add 3-5 FAQs that answer common questions:

```tsx
// app/blog/post/[slug]/page.tsx

import { FAQSchema } from '@/components/seo/FAQSchema';

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  // Define FAQs based on the post topic
  const faqs = getFAQsForPost(slug); // Create this helper function

  return (
    <>
      <FAQSchema faqs={faqs} />
      {/* Existing content */}
    </>
  );
}
```

### Step 3: Add Product Schema to Gift Lists

Extract product information from blog posts and create structured data:

```tsx
import { ProductSchema } from '@/components/seo/ProductSchema';

// If you have product data in your blog post, structure it:
const products = extractProductsFromContent(post.content);

return (
  <>
    <ProductSchema products={products} />
    {/* Existing content */}
  </>
);
```

## Testing Schema Markup

After adding schema:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Paste your page URL
   - Check for errors
   - Preview how it looks in search

2. **Schema Markup Validator**: https://validator.schema.org/
   - Validates JSON-LD syntax
   - Shows warnings and errors

3. **Google Search Console**:
   - Check "Enhancements" section
   - Monitor FAQ and Product rich results
   - Fix any errors reported

## Common Questions

**Q: How long until I see rich snippets in Google?**
A: 2-4 weeks after adding schema. Google needs to recrawl and index your pages.

**Q: Will all pages with FAQ schema show FAQs in search?**
A: No - Google chooses when to show rich snippets. But having schema increases the chance significantly.

**Q: Can I add both FAQ and Product schema to the same page?**
A: Yes! Many gift guide pages benefit from both.

**Q: Do I need to add schema to every blog post?**
A: No - focus on high-traffic pages first (top 20% of your content).

## Performance Impact

✅ **Zero performance impact** - Schema is added as JSON-LD in <head>, doesn't affect page speed
✅ **Loads before interactive** - Uses `strategy="beforeInteractive"`
✅ **SEO-only** - Not visible to users, only to search engines

## Maintenance

- Review schema quarterly
- Update prices if they change
- Add new FAQs based on user questions
- Monitor Search Console for errors
- Test with Rich Results Test after updates
