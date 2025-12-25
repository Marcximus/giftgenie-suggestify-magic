-- Performance optimization for blog_posts table queries
-- This migration adds indexes to improve query performance

-- Index on slug column for fast lookups (if not already exists)
-- This is critical since every blog post page queries by slug
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Index on published_at for sorting blog post listings
-- Used in blog listing page: .order("published_at", { ascending: false })
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Composite index for published posts (commonly filtered and sorted together)
-- Used in blog listing: .not("published_at", "is", null).order("published_at", ...)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_sorted
ON blog_posts(published_at DESC)
WHERE published_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_blog_posts_slug IS 'Fast lookups for individual blog posts by slug';
COMMENT ON INDEX idx_blog_posts_published_at IS 'Fast sorting of blog posts by publication date';
COMMENT ON INDEX idx_blog_posts_published_sorted IS 'Optimized index for published posts listing page';
