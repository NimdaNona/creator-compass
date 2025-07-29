import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { communityService } from '@/lib/community/community-service';
import { z } from 'zod';
import { PostCategory } from '@/types/community';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(10000),
  category: z.nativeEnum(PostCategory),
  tags: z.array(z.string()).max(10),
  attachments: z.array(z.object({
    type: z.enum(['image', 'video', 'file']),
    url: z.string().url(),
    name: z.string(),
    size: z.number(),
    mimeType: z.string()
  })).optional()
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const filters = {
      category: searchParams.get('category') as PostCategory | undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      authorId: searchParams.get('authorId') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') === 'true'
    };

    const pagination = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') || 'recent') as 'recent' | 'popular' | 'trending'
    };

    const result = await communityService.getPosts(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get posts:', error);
    return NextResponse.json(
      { error: 'Failed to get posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createPostSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const post = await communityService.createPost(
      session.user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}