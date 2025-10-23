import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
  'Cache-Control': 'public, max-age=3600'
};

// These are our canonical static URLs
const staticUrls = [
  {
    loc: 'https://getthegift.ai',
    changefreq: 'daily',
    priority: '1.0'
  },
  {
    loc: 'https://getthegift.ai/about',
    changefreq: 'weekly',
    priority: '0.8'
  },
  {
    loc: 'https://getthegift.ai/blog',
    changefreq: 'daily',
    priority: '0.9'
  }
];

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating sitemap...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Only fetch published blog posts that should be indexed
    // Filter for complete, healthy posts only to avoid 5xx errors in sitemap
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at, word_count, content, generation_attempts')
      .not('published_at', 'is', null)
      .not('content', 'is', null)
      .gte('word_count', 500)  // Only posts with substantial content
      .lt('generation_attempts', 3)  // Exclude repeatedly failed posts
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${posts?.length || 0} healthy blog posts for sitemap`);
    console.log(`Filter criteria: word_count >= 500, content not null, generation_attempts < 3`);

    // Generate sitemap XML with proper XML declaration and encoding
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
${posts?.map(post => {
  const canonicalUrl = `https://getthegift.ai/blog/post/${post.slug}`;
  return `
  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${new Date(post.updated_at || post.published_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
}).join('')}
</urlset>`;

    return new Response(xml, { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return basic sitemap with static pages if there's an error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;

    return new Response(fallbackXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8'
      },
      status: 500
    });
  }
});