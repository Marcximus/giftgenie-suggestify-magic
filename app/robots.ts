import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/auth', '/blog/admin', '/blog/new', '/blog/edit'],
      },
    ],
    sitemap: 'https://getthegift.ai/sitemap.xml',
  };
}
