
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const generateSitemapXML = (urls: string[]) => {
  const urlElements = urls
    .map(url => `
    <url>
      <loc>${url}</loc>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
  <?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://getthegift.ai/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>https://getthegift.ai/blog</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://getthegift.ai/about</loc>
      <changefreq>monthly</changefreq>
      <priority>0.5</priority>
    </url>
    ${urlElements}
  </urlset>`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sitemap generation...', { timestamp: new Date().toISOString() });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching published blog posts...');
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at, title')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching blog posts:', {
        error: postsError,
        details: postsError.details,
        hint: postsError.hint,
        code: postsError.code
      });
      // Return basic sitemap without blog posts if database query fails
      const basicSitemap = generateSitemapXML([]);
      return new Response(basicSitemap, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    console.log(`Found ${posts?.length || 0} published blog posts`);
    
    if (posts) {
      // Log detailed information about each post
      posts.forEach((post, index) => {
        console.log(`Processing post ${index + 1}/${posts.length}:`, {
          slug: post.slug,
          title: post.title,
          publishedAt: post.published_at,
          lastUpdated: post.updated_at,
          hasSlug: !!post.slug,
          slugLength: post.slug?.length
        });
      });

      // Log any posts that might be problematic
      const problemPosts = posts.filter(post => !post.slug || post.slug.length === 0);
      if (problemPosts.length > 0) {
        console.warn('Found posts with missing or empty slugs:', problemPosts);
      }
    }

    const blogUrls = (posts || [])
      .filter(post => {
        if (!post.slug) {
          console.warn('Found post without slug:', {
            title: post.title,
            publishedAt: post.published_at,
            updatedAt: post.updated_at
          });
          return false;
        }
        if (!/^[a-zA-Z0-9-]+$/.test(post.slug)) {
          console.warn('Found post with invalid slug characters:', {
            slug: post.slug,
            title: post.title
          });
          return false;
        }
        return true;
      })
      .map(post => {
        const url = `https://getthegift.ai/blog/post/${post.slug}`;
        console.log('Generated URL:', url);
        return url;
      });

    console.log(`Generated ${blogUrls.length} blog URLs for sitemap`, {
      totalPosts: posts?.length || 0,
      urlsGenerated: blogUrls.length,
      skippedPosts: (posts?.length || 0) - blogUrls.length
    });
    
    const sitemap = generateSitemapXML(blogUrls);
    console.log('Sitemap generation completed successfully', {
      timestamp: new Date().toISOString(),
      totalUrls: blogUrls.length + 3 // +3 for static pages
    });

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Error generating sitemap:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return basic sitemap without blog posts in case of error
    const basicSitemap = generateSitemapXML([]);
    return new Response(basicSitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
});
