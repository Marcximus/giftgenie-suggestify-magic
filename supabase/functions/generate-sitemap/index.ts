
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
    console.log('Starting sitemap generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching published blog posts...');
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching blog posts:', postsError);
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
      // Log each post being processed
      posts.forEach((post, index) => {
        console.log(`Processing post ${index + 1}/${posts.length}:`, {
          slug: post.slug,
          lastUpdated: post.updated_at
        });
      });
    }

    const blogUrls = (posts || [])
      .filter(post => {
        if (!post.slug) {
          console.warn('Found post without slug:', post);
          return false;
        }
        return true;
      })
      .map(post => `https://getthegift.ai/blog/post/${post.slug}`);

    console.log(`Generated ${blogUrls.length} blog URLs for sitemap`);
    
    const sitemap = generateSitemapXML(blogUrls);
    console.log('Sitemap generation completed successfully');

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
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
