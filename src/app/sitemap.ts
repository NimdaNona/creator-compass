import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://creatorsaicompass.com';
  const lastModified = new Date();

  // Static pages with their priority
  const staticPages = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // Platform-specific pages
  const platforms = ['youtube', 'tiktok', 'twitch'];
  const platformPages = platforms.map(platform => ({
    url: `${baseUrl}/platform-tools/${platform}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Template categories
  const templateCategories = [
    'content-planning',
    'channel-optimization',
    'audience-growth',
    'video-scripts',
    'thumbnails-titles',
    'analytics-reporting'
  ];
  
  const templatePages = templateCategories.map(category => ({
    url: `${baseUrl}/templates/${category}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Resource categories
  const resourceCategories = [
    'youtube-guides',
    'tiktok-guides',
    'twitch-guides',
    'tools',
    'trends',
    'case-studies'
  ];

  const resourcePages = resourceCategories.map(category => ({
    url: `${baseUrl}/resources/${category}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Combine all pages
  return [
    ...staticPages,
    ...platformPages,
    ...templatePages,
    ...resourcePages,
  ];
}