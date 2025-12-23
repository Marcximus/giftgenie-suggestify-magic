# Image Optimization Guide

Complete guide to optimizing images for maximum performance and SEO.

## Quick Wins ✅

Current optimizations in place:
- ✅ Explicit width/height attributes (prevents CLS)
- ✅ Lazy loading for off-screen images
- ✅ fetchpriority="high" for hero images
- ✅ Async decoding
- ✅ Aspect-ratio containers
- ✅ Alt text on all images
- ✅ Error handling with fallbacks

## Image Format Optimization

### WebP Format (Recommended)

**Benefits:**
- 25-35% smaller than JPEG
- 25-50% smaller than PNG
- Supports transparency (like PNG)
- Supported by 96%+ of browsers

**How to Convert Images to WebP:**

#### Option 1: Online Tools (Easiest)
- https://squoosh.app/ (Google's tool - best quality)
- https://convertio.co/jpg-webp/
- https://cloudconvert.com/jpg-to-webp

#### Option 2: Command Line (Bulk Conversion)

Install cwebp:
```bash
# Mac
brew install webp

# Ubuntu/Debian
sudo apt-get install webp

# Windows
Download from https://developers.google.com/speed/webp/download
```

Convert images:
```bash
# Single image
cwebp -q 85 input.jpg -o output.webp

# Batch convert all JPGs in a folder
for file in *.jpg; do cwebp -q 85 "$file" -o "${file%.jpg}.webp"; done
```

#### Option 3: Node.js Script (Automated)

```javascript
// scripts/convert-to-webp.mjs
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';

const inputDir = './images/original';
const outputDir = './images/optimized';

const files = await readdir(inputDir);

for (const file of files) {
  if (file.match(/\.(jpg|jpeg|png)$/i)) {
    await sharp(path.join(inputDir, file))
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp')));

    console.log(`Converted ${file} to WebP`);
  }
}
```

### Image Size Guidelines

**Blog Hero Images:**
- Dimensions: 1200x675px (16:9 aspect ratio)
- Format: WebP
- Quality: 85
- Target size: <150KB

**Blog Thumbnails:**
- Dimensions: 400x400px (1:1 aspect ratio)
- Format: WebP
- Quality: 80
- Target size: <30KB

**Product Images:**
- Dimensions: 800x800px
- Format: WebP
- Quality: 85
- Target size: <100KB

## Responsive Images

### Using srcset for Different Screen Sizes

```tsx
<img
  src="image-800w.webp"
  srcSet="
    image-400w.webp 400w,
    image-800w.webp 800w,
    image-1200w.webp 1200w
  "
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
  alt="Description"
  width="1200"
  height="675"
  loading="lazy"
/>
```

**Benefits:**
- Mobile users download smaller images
- Saves bandwidth
- Faster page load
- Better Core Web Vitals scores

## Compression Settings

### JPEG/JPG
- Quality: 80-85 for photos
- Use progressive encoding
- Remove EXIF data (except copyright)

### PNG
- Use for logos, icons, screenshots
- Run through TinyPNG or pngquant
- Consider converting to WebP if no transparency needed

### WebP
- Quality: 80-85 (sweet spot for size vs quality)
- Use lossy compression for photos
- Use lossless for graphics with text

## Image CDN (Advanced)

For high-traffic sites, consider using an image CDN:

**Options:**
1. **Cloudflare Images** ($5/month for 100k images)
   - Automatic WebP conversion
   - Automatic resizing
   - Global CDN

2. **Cloudinary** (Free tier: 25GB/month)
   - URL-based transformations
   - Automatic format selection
   - Lazy loading built-in

3. **ImageKit** (Free tier: 20GB/month)
   - Real-time image optimization
   - Automatic WebP/AVIF
   - Responsive images

**Example with ImageKit:**
```tsx
// Original
<img src="https://supabase.co/storage/.../image.jpg" />

// With ImageKit
<img src="https://ik.imagekit.io/yourapp/tr:w-800,q-85,f-webp/image.jpg" />
```

## Supabase Storage Optimization

### Current Setup
Supabase doesn't auto-convert to WebP, so upload optimized images.

### Upload Workflow

1. **Prepare Image:**
   ```bash
   # Resize and convert to WebP
   cwebp -resize 1200 675 -q 85 original.jpg -o optimized.webp
   ```

2. **Upload to Supabase:**
   - Use Supabase dashboard or API
   - Store in `blog-images` bucket
   - Use descriptive filenames: `christmas-gifts-wife-hero.webp`

3. **Update Image URL in Database:**
   ```sql
   UPDATE blog_posts
   SET image_url = 'https://ckcqttsdpxfbpkzljctl.supabase.co/storage/v1/object/public/blog-images/christmas-gifts-wife-hero.webp'
   WHERE slug = 'top-10-christmas-gifts-for-wife';
   ```

### Bulk Optimization Script

```javascript
// scripts/optimize-blog-images.mjs
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fetch from 'node-fetch';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Get all blog posts with images
const { data: posts } = await supabase
  .from('blog_posts')
  .select('id, slug, image_url')
  .not('image_url', 'is', null);

for (const post of posts) {
  // Download original image
  const response = await fetch(post.image_url);
  const buffer = await response.arrayBuffer();

  // Convert to WebP
  const webpBuffer = await sharp(Buffer.from(buffer))
    .resize(1200, 675, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  // Upload to Supabase
  const filename = `${post.slug}-hero.webp`;
  await supabase.storage
    .from('blog-images')
    .upload(filename, webpBuffer, {
      contentType: 'image/webp',
      upsert: true
    });

  // Update database
  const newUrl = `${SUPABASE_URL}/storage/v1/object/public/blog-images/${filename}`;
  await supabase
    .from('blog_posts')
    .update({ image_url: newUrl })
    .eq('id', post.id);

  console.log(`Optimized image for: ${post.slug}`);
}
```

## Lazy Loading Strategy

### Above-the-fold (Load Immediately)
- Hero image: `loading="eager"` + `fetchpriority="high"`
- Logo: `loading="eager"`

### Below-the-fold (Lazy Load)
- Blog thumbnails: `loading="lazy"`
- Related post images: `loading="lazy"`
- Product images in content: `loading="lazy"`

### Implementation
```tsx
// Hero image (top of page)
<img
  src="hero.webp"
  loading="eager"
  fetchPriority="high"
  alt="..."
/>

// Thumbnail (below fold)
<img
  src="thumbnail.webp"
  loading="lazy"
  decoding="async"
  alt="..."
/>
```

## Performance Monitoring

### Metrics to Track

**Lighthouse Score:**
- Target: 90+ for Performance
- Monitor Core Web Vitals

**Core Web Vitals:**
- **LCP (Largest Contentful Paint)**: <2.5s ✅
  - Affected by hero image size
  - Use fetchpriority="high"

- **CLS (Cumulative Layout Shift)**: <0.1 ✅
  - Fixed by explicit width/height
  - Use aspect-ratio containers

- **FID (First Input Delay)**: <100ms ✅
  - Not affected by images

### Tools

1. **PageSpeed Insights**: https://pagespeed.web.dev/
   - Test with your blog post URLs
   - Check both mobile and desktop
   - Look for image optimization suggestions

2. **WebPageTest**: https://www.webpagetest.org/
   - Detailed waterfall charts
   - Shows when images load
   - Multiple locations testing

3. **Chrome DevTools:**
   - Network tab: Check image sizes
   - Performance tab: Check LCP
   - Coverage tab: Find unused images

## Checklist for New Images

Before uploading a new blog post image:

- [ ] Resize to correct dimensions (1200x675 for hero)
- [ ] Convert to WebP format
- [ ] Compress to target size (<150KB hero, <30KB thumbnail)
- [ ] Use descriptive filename (seo-friendly-name.webp)
- [ ] Add to Supabase storage
- [ ] Set alt text in database
- [ ] Test page speed after adding
- [ ] Verify no CLS in Lighthouse

## Quick Reference

```bash
# Optimize a single image
cwebp -resize 1200 675 -q 85 input.jpg -o output.webp

# Check file size
ls -lh output.webp

# Target sizes
Hero image: < 150KB
Thumbnail: < 30KB
Product: < 100KB
```

## Future Optimizations

Consider implementing:
- [ ] Automatic WebP conversion on upload
- [ ] Image CDN for global distribution
- [ ] AVIF format support (next-gen, even smaller)
- [ ] Blur-up placeholders (LQIP)
- [ ] Critical image preload in <head>
