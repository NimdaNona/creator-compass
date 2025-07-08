import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { ratelimiters, rateLimit } from '@/lib/ratelimit';

// GET - Get current subscription
export async function GET(request: NextRequest) {
  // Apply rate limiting for payment endpoints
  const rateLimitResponse = await rateLimit(request, ratelimiters?.payment || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = user.subscription || {
      status: 'free',
      plan: 'free',
      isYearly: false,
    };

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update subscription (cancel, reactivate, etc.)
export async function POST(request: NextRequest) {
  // Apply rate limiting for payment endpoints
  const rateLimitResponse = await rateLimit(request, ratelimiters?.payment || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userSubscription = user.subscription;
    if (!userSubscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    switch (action) {
      case 'cancel':
        await handleCancelSubscription(userSubscription.stripeSubscriptionId, user.id);
        break;
      
      case 'reactivate':
        await handleReactivateSubscription(userSubscription.stripeSubscriptionId, user.id);
        break;
      
      case 'cancel_at_period_end':
        await handleCancelAtPeriodEnd(userSubscription.stripeSubscriptionId, user.id);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get updated subscription
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: true },
    });

    return NextResponse.json({ 
      subscription: updatedUser?.subscription,
      success: true 
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCancelSubscription(subscriptionId: string, userId: string) {
  // Cancel subscription immediately
  await stripe.subscriptions.cancel(subscriptionId);
  
  // Update local database
  await prisma.userSubscription.update({
    where: { userId },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
      plan: 'free',
    },
  });
}

async function handleReactivateSubscription(subscriptionId: string, userId: string) {
  // Reactivate subscription
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  
  // Update local database
  await prisma.userSubscription.update({
    where: { userId },
    data: {
      status: 'active',
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });
}

async function handleCancelAtPeriodEnd(subscriptionId: string, userId: string) {
  // Cancel at period end
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  
  // Update local database
  await prisma.userSubscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
    },
  });
}