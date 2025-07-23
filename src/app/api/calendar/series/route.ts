import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validatePlatformSwitch } from '@/lib/platform-validation';

// Schema for creating series
const seriesSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: z.string(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  defaultDay: z.number().min(0).max(6).optional(), // 0-6 for day of week
  defaultTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  isActive: z.boolean().optional()
});

// GET /api/calendar/series - Get all series
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const series = await prisma.contentSeries.findMany({
      where: {
        userId: user.id
      },
      include: {
        _count: {
          select: { events: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ series });

  } catch (error) {
    console.error('Error fetching content series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content series' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/series - Create new series
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has premium access
    const isActive = user.subscription?.status === 'active';
    if (!isActive) {
      return NextResponse.json(
        { 
          error: 'Content series is a premium feature',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = seriesSchema.parse(body);

    // Validate platform selection
    const platformValidation = await validatePlatformSwitch(user.id, validatedData.platform);
    
    if (!platformValidation.allowed) {
      return NextResponse.json({ 
        error: platformValidation.error, 
        requiresUpgrade: platformValidation.requiresUpgrade,
        currentPlatform: platformValidation.currentPlatform,
        subscription: platformValidation.subscription
      }, { status: 403 });
    }

    // Create series
    const series = await prisma.contentSeries.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        description: validatedData.description,
        platform: validatedData.platform,
        frequency: validatedData.frequency,
        defaultDay: validatedData.defaultDay,
        defaultTime: validatedData.defaultTime,
        isActive: validatedData.isActive ?? true
      }
    });

    return NextResponse.json({ series }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating content series:', error);
    return NextResponse.json(
      { error: 'Failed to create content series' },
      { status: 500 }
    );
  }
}