/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Disable image optimization to prevent serverless function timeouts
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ckcqttsdpxfbpkzljctl.supabase.co',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: 'https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/generate-sitemap',
      },
      {
        source: '/functions/v1/:path*',
        destination: 'https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
