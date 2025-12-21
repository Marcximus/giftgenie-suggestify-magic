# Schema Implementation Example

Quick guide to add FAQ and Product schemas to your top-performing blog posts.

## Step 1: Identify Posts to Enhance

Start with your highest-traffic posts:
1. "Top 10 Best Christmas Gifts for Wife"
2. "Top 10 Unique Gift Ideas for Men"
3. "Top 10 Best Gifts for Boyfriend Under $50"
4. etc.

## Step 2: Create FAQ Content

For each post, write 3-5 FAQs based on:
- Common questions people search for
- Questions in comments/emails
- "People Also Ask" in Google search results

### Example FAQs for "Top 10 Christmas Gifts for Wife"

```typescript
const faqs = [
  {
    question: "What are the best Christmas gifts for wives in 2024?",
    answer: "The best Christmas gifts for wives include personalized jewelry, luxury spa experiences, smart home devices, designer handbags, and thoughtful keepsakes. The key is choosing something that matches her interests and shows you put thought into the gift."
  },
  {
    question: "How much should I spend on a Christmas gift for my wife?",
    answer: "There's no set amount - it depends on your budget and relationship stage. Most people spend between $50-$200 on their spouse's Christmas gift. Remember, thoughtfulness matters more than price - a meaningful $30 gift can be more appreciated than an expensive generic one."
  },
  {
    question: "When should I start Christmas shopping for my wife?",
    answer: "Start shopping 4-6 weeks before Christmas (early to mid-November) to avoid shipping delays, sold-out popular items, and last-minute stress. This gives you time to find the perfect gift, compare prices, and potentially return/exchange if needed."
  },
  {
    question: "What if my wife says she doesn't want anything for Christmas?",
    answer: "Even if she says this, most people appreciate a thoughtful gift. Focus on experiences (spa day, dinner reservations), practical items she needs but won't buy herself, or sentimental gifts that show you know her well. Avoid generic gifts - personalization is key."
  }
];
```

## Step 3: Integrate into Blog Post Component

### Option A: Add to Individual Posts (Recommended)

Create a file like `app/blog/post/schemas/christmas-gifts-wife.ts`:

```typescript
// app/blog/post/schemas/christmas-gifts-wife.ts
import { FAQItem } from '@/components/seo/FAQSchema';
import { ProductItem } from '@/components/seo/ProductSchema';

export const faqsChristmasGiftsWife: FAQItem[] = [
  {
    question: "What are the best Christmas gifts for wives in 2024?",
    answer: "The best Christmas gifts for wives include personalized jewelry, luxury spa experiences, smart home devices, designer handbags, and thoughtful keepsakes. The key is choosing something that matches her interests and shows you put thought into the gift."
  },
  {
    question: "How much should I spend on a Christmas gift for my wife?",
    answer: "There's no set amount - it depends on your budget and relationship stage. Most people spend between $50-$200 on their spouse's Christmas gift. Remember, thoughtfulness matters more than price."
  },
  {
    question: "When should I start Christmas shopping for my wife?",
    answer: "Start shopping 4-6 weeks before Christmas (early to mid-November) to avoid shipping delays and sold-out items. This gives you time to find the perfect gift and compare prices."
  }
];

export const productsChristmasGiftsWife: ProductItem[] = [
  {
    name: "Personalized Star Map Print",
    description: "Custom star map showing the night sky on your wedding date or anniversary - a romantic and unique gift she'll treasure forever",
    image: "https://m.media-amazon.com/images/I/816L0CW7cgL._AC_UL960_FMwebp_QL65_.jpg",
    url: "https://www.amazon.com/dp/B08XYZ123",
    price: "49.99",
    priceCurrency: "USD",
    availability: "InStock",
    rating: {
      value: 4.8,
      count: 1250
    }
  },
  {
    name: "Luxury Silk Pajama Set",
    description: "Premium mulberry silk pajamas for ultimate comfort and luxury - perfect for the wife who deserves to feel pampered",
    image: "https://m.media-amazon.com/images/I/6195vuJIfML._AC_UL960_FMwebp_QL65_.jpg",
    url: "https://www.amazon.com/dp/B07ABC456",
    price: "89.99",
    priceCurrency: "USD",
    availability: "InStock",
    rating: {
      value: 4.6,
      count: 890
    }
  },
  // ... add more products (up to 10)
];
```

Then modify your blog post page:

```typescript
// app/blog/post/[slug]/page.tsx
import { FAQSchema } from '@/components/seo/FAQSchema';
import { ProductSchema } from '@/components/seo/ProductSchema';
import { faqsChristmasGiftsWife, productsChristmasGiftsWife } from './schemas/christmas-gifts-wife';

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  // Get schemas based on slug
  let faqs, products;

  if (slug === 'top-10-best-christmas-gift-for-wife') {
    faqs = faqsChristmasGiftsWife;
    products = productsChristmasGiftsWife;
  }
  // Add more slug-specific schemas here...

  return (
    <>
      {faqs && <FAQSchema faqs={faqs} />}
      {products && <ProductSchema products={products} />}

      {/* Existing article schema */}
      <Script id="article-schema" ... />
      <Script id="breadcrumb-schema" ... />

      {/* Rest of page */}
      <div className="min-h-screen flex flex-col">
        {/* ... */}
      </div>
    </>
  );
}
```

### Option B: Store in Database (Scalable)

Add `faq_schema` and `product_schema` JSON columns to `blog_posts` table:

```sql
ALTER TABLE blog_posts
ADD COLUMN faq_schema JSONB,
ADD COLUMN product_schema JSONB;
```

Then populate:

```sql
UPDATE blog_posts
SET faq_schema = '[
  {
    "question": "What are the best Christmas gifts for wives?",
    "answer": "..."
  }
]'::jsonb,
product_schema = '[
  {
    "name": "...",
    "description": "...",
    "price": "49.99"
  }
]'::jsonb
WHERE slug = 'top-10-best-christmas-gift-for-wife';
```

Update component:

```typescript
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  // Parse schemas from database
  const faqs = post.faq_schema ? JSON.parse(post.faq_schema) : null;
  const products = post.product_schema ? JSON.parse(post.product_schema) : null;

  return (
    <>
      {faqs && <FAQSchema faqs={faqs} />}
      {products && <ProductSchema products={products} />}
      {/* ... */}
    </>
  );
}
```

## Step 4: Test Implementation

### 1. View Page Source
Visit the blog post and view source (Ctrl+U or Cmd+U):

Look for this in the `<head>`:
```html
<script type="application/ld+json" id="faq-schema">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [...]
}
</script>
```

### 2. Google Rich Results Test
1. Go to: https://search.google.com/test/rich-results
2. Enter your blog post URL
3. Click "Test URL"
4. Check for:
   - ✅ FAQPage detected
   - ✅ Product or ItemList detected
   - ❌ No errors

### 3. Schema Markup Validator
1. Go to: https://validator.schema.org/
2. Paste your page URL
3. Validate there are no errors

## Step 5: Monitor Results

### Google Search Console

After 2-4 weeks, check Search Console:

1. Go to **Enhancements > FAQ**
   - Check how many pages have FAQ rich results
   - Fix any errors

2. Go to **Enhancements > Product**
   - Monitor product rich result status
   - Check for warnings

3. Go to **Performance**
   - Monitor impressions (should increase)
   - Monitor CTR (should improve with rich snippets)
   - Filter by "FAQ" or "Product" queries

### Expected Improvements

- **Impressions**: +20-50% (more visibility)
- **CTR**: +5-15% (rich snippets are more clickable)
- **Position**: May improve as Google sees better content
- **Rich Results**: Appear in 2-4 weeks after indexing

## Priority List

Add schemas to these posts first (highest traffic):

1. ✅ Top 10 Best Christmas Gift for Wife
2. ⬜ Top 10 Unique Gift Ideas for Men
3. ⬜ Top 10 Best Gifts for Boyfriend Under $50
4. ⬜ Top 10 Best Gifts for Wife Under $50
5. ⬜ Top 10 Best Gifts for Girlfriend Under $50
6. ⬜ Top 10 Best Gifts for Husband Under $50
7. ⬜ Top 10 Halloween Gifts for Him
8. ⬜ Top 10 Most Romantic Gifts for Him
9. ⬜ Top 10 Most Romantic Gifts for Her
10. ⬜ Top 10 Best Secret Santa Gifts

## Quick Template

Copy this for each new post:

```typescript
export const faqs_POST_SLUG: FAQItem[] = [
  {
    question: "",
    answer: ""
  },
  {
    question: "",
    answer: ""
  },
  {
    question: "",
    answer: ""
  }
];

export const products_POST_SLUG: ProductItem[] = [
  {
    name: "",
    description: "",
    image: "",
    url: "",
    price: "",
    priceCurrency: "USD",
    availability: "InStock"
  }
];
```

## Tips for Success

✅ **Do:**
- Keep answers concise (2-3 sentences)
- Answer real questions people search for
- Update prices regularly
- Use descriptive product names
- Include ratings if available

❌ **Don't:**
- Keyword stuff in FAQs
- Make up fake questions
- Use placeholder prices
- Duplicate FAQ content across pages
- Add too many FAQs (3-5 is optimal)

## Maintenance Schedule

- **Weekly**: Check Search Console for errors
- **Monthly**: Update prices if changed
- **Quarterly**: Review and refresh FAQ content
- **Annually**: Audit all schemas for accuracy

---

Start with your top 3 posts, test thoroughly, then roll out to the rest! 🚀
