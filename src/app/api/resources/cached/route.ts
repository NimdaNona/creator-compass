import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withSWRCache } from '@/lib/middleware/cache-middleware';
import { CACHE_TTL } from '@/lib/redis';

// Use stale-while-revalidate pattern for resources
const cacheOptions = {
  ttl: CACHE_TTL.LONG,
  staleTime: 60000, // 1 minute before considered stale
  tags: ['resources'],
  excludeParams: ['_t'], // Exclude timestamp params
};

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (category) where.category = category;
    if (platform) where.platform = platform;

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          platform: true,
          url: true,
          imageUrl: true,
          featured: true,
          premiumOnly: true,
          createdAt: true,
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    return NextResponse.json({
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// Export with SWR cache middleware
export async function GET(req: NextRequest) {
  return withSWRCache(cacheOptions)(req, handler);
}