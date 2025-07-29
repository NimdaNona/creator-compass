import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withCache, createCacheHeaders } from '@/lib/middleware/cache-middleware';
import { CACHE_TTL } from '@/lib/redis';

// Cache featured templates for 1 hour
const cacheOptions = {
  ttl: CACHE_TTL.LONG,
  tags: ['templates', 'featured'],
};

async function handler(req: NextRequest) {
  try {
    const featuredTemplates = await prisma.template.findMany({
      where: {
        featured: true,
        active: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        icon: true,
        platform: true,
        prompt: true,
        requiredInputs: true,
        premiumOnly: true,
        createdAt: true,
      },
      orderBy: {
        order: 'asc',
      },
      take: 12,
    });

    return NextResponse.json(
      {
        templates: featuredTemplates,
        count: featuredTemplates.length,
        cached: false,
      },
      {
        headers: createCacheHeaders({
          maxAge: 300, // 5 minutes browser cache
          sMaxAge: 3600, // 1 hour CDN cache
          staleWhileRevalidate: 86400, // 1 day stale-while-revalidate
        }),
      }
    );
  } catch (error) {
    console.error('Failed to fetch featured templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Export with cache middleware
export async function GET(req: NextRequest) {
  return withCache(cacheOptions)(req, handler);
}