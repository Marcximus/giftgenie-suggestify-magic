# Blog Post Query Optimization Report

**Date:** December 25, 2025
**Issue:** Blog post queries taking 15-28 seconds, causing 502/504 timeout errors
**Root Cause:** Inefficient database queries fetching unnecessary data

## Problem Analysis

### Current State
- Query uses `.select("*")` which fetches ALL 24+ columns
- Includes 7 large JSON fields (~5-50KB each):
  - `affiliate_links`
  - `breadcrumb_list`
  - `images`
  - `processing_status`
  - `product_reviews`
  - `product_search_failures`
  - `related_posts`
- Includes 13+ unused metadata columns
- Large `content` field (10-50KB HTML) + all extra data = massive transfer

### Data Transfer Math
**Before optimization:**
- Content: ~30KB (HTML)
- JSON fields: ~7 fields × ~10KB avg = ~70KB
- Other metadata: ~5KB
- **Total per query: ~105KB**

**After optimization:**
- Content: ~30KB (HTML)
- 10 small metadata columns: ~2KB
- **Total per query: ~32KB**

**Reduction: ~70% less data transferred per query**

## Optimization Changes

### 1. Query Column Selection (app/blog/post/[slug]/page.tsx)

**Before:**
```typescript
.select("*")
```

**After:**
```typescript
.select("title, slug, content, excerpt, meta_description, seo_keywords, image_url, image_alt_text, published_at, updated_at, created_at")
```

**Columns Eliminated:**
- `affiliate_links` (JSON) - not used in rendering
- `breadcrumb_list` (JSON) - not used (we generate breadcrumbs from slug)
- `images` (JSON) - not used (we use `image_url` field)
- `processing_status` (JSON) - internal metadata
- `product_reviews` (JSON) - not rendered
- `product_search_failures` (JSON) - internal debugging
- `related_posts` (JSON) - not used (we query separately)
- `generation_attempts` - internal metadata
- `last_generation_error` - internal debugging
- `content_format_version` - internal versioning
- `reading_time` - not displayed
- `word_count` - not displayed
- `meta_keywords` - not used
- `meta_title` - not used
- `main_entity` - not used
- `author` - not displayed
- `category_id` - not displayed

### 2. Database Indexing (supabase/migrations/20251225_optimize_blog_posts_queries.sql)

**Added Indexes:**
1. `idx_blog_posts_slug` - Fast lookup by slug (primary query pattern)
2. `idx_blog_posts_published_at` - Fast sorting by publication date
3. `idx_blog_posts_published_sorted` - Composite index for listing page (WHERE published_at IS NOT NULL + ORDER BY)

## Expected Performance Impact

### Query Time Reduction
**Before:**
- Data transfer: ~105KB
- Network latency: ~500ms-2s (Netlify → Supabase)
- Query execution: ~100-500ms
- Deserialization: ~200-500ms (parsing JSON)
- **Total: 800ms - 3s (typical), 15-28s (under load)**

**After:**
- Data transfer: ~32KB (70% reduction)
- Network latency: ~200-800ms (smaller payload)
- Query execution: ~50-200ms (index on slug)
- Deserialization: ~50-100ms (no JSON parsing)
- **Total: 300ms - 1.1s (typical), 2-4s (under load)**

**Expected improvement: 60-85% faster queries**

### Build Time Impact
- Pre-rendering 445 blog posts at build time
- **Before:** 445 posts × 2s avg = ~890 seconds (~15 minutes)
- **After:** 445 posts × 0.5s avg = ~223 seconds (~4 minutes)
- **Build time reduction: ~11 minutes** ⚡

### Crawler Impact
- Ahrefs/Google crawlers make 50-100 concurrent requests
- **Before:** Overwhelms serverless functions, 31-32% error rate
- **After:** Fast CDN responses, <1% error rate expected

## Additional Recommendations

### 1. Add Supabase Connection Pooling
```typescript
// app/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-connection-pool': 'true',
    },
  },
});
```

### 2. Consider Read Replicas (Supabase Pro)
- If on Supabase Pro plan, configure read replicas for blog post queries
- Further reduces latency and load on primary database

### 3. Monitor Query Performance
Add logging to track actual query times post-optimization:
```typescript
const startTime = Date.now();
const { data: post, error } = await queryPromise;
console.log(`[Performance] Blog post query took ${Date.now() - startTime}ms`);
```

## Rollout Plan

1. ✅ **Code Changes:** Update query to select specific columns
2. ✅ **Migration File:** Created database index migration
3. ⏳ **Deploy Migration:** Run migration on Supabase dashboard
4. ⏳ **Deploy Code:** Push changes to trigger Netlify rebuild
5. ⏳ **Monitor:** Watch build logs for performance improvements
6. ⏳ **Verify:** Test random blog posts for <1s response times
7. ⏳ **Recrawl:** Trigger fresh Ahrefs/GSC crawl to confirm fixes

## Success Metrics

**Before:**
- Query time: 15-28 seconds (under load)
- Build time: ~15 minutes
- Error rate: 31-32% (GSC data)
- Data transfer: ~105KB per query

**Target After:**
- Query time: <1 second (typical), <3s (under load)
- Build time: <5 minutes
- Error rate: <1%
- Data transfer: ~32KB per query

## Next Steps

1. Apply the Supabase migration in your Supabase dashboard:
   - Go to SQL Editor
   - Run `supabase/migrations/20251225_optimize_blog_posts_queries.sql`

2. Deploy the code changes (already committed)

3. Monitor the next build for improvements

4. Trigger a fresh Ahrefs crawl after deploy to verify error rate drops

---

**Note:** The migration file is safe to run multiple times (`CREATE INDEX IF NOT EXISTS` is idempotent). The code changes are backward compatible since we're only changing which columns we SELECT, not the database schema.
