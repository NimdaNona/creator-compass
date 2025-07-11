import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/verify-email',
          '/auth/reset-password',
          '/dashboard/',
          '/settings/',
          '/calendar/',
          '/ideas/',
          '/analytics/',
          '/achievements/',
          '/foryou/',
          '/community/'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/verify-email',
          '/auth/reset-password',
          '/dashboard/',
          '/settings/'
        ],
      },
    ],
    sitemap: 'https://creatorsaicompass.com/sitemap.xml',
  };
}