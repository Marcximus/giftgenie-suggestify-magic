import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://ckcqttsdpxfbpkzljctl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY3F0dHNkcHhmYnBremxqY3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxNjE0MTAsImV4cCI6MjA1MDczNzQxMH0.VlnPro-j6hNxQuLxYQTEurItRVhidVguJhLvEfLv44Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchSlugs() {
  console.log('Fetching blog post slugs from Supabase...');
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .not('published_at', 'is', null)
    .order('slug');

  if (error) {
    console.error('Error fetching slugs:', error);
    process.exit(1);
  }

  const slugs = data.map(p => p.slug);
  console.log(`Found ${slugs.length} blog posts`);

  // Write to file
  const outputPath = path.join(process.cwd(), 'app', 'blog', 'post', 'slugs.json');
  fs.writeFileSync(outputPath, JSON.stringify(slugs, null, 2));
  console.log(`Wrote slugs to ${outputPath}`);
}

fetchSlugs();
