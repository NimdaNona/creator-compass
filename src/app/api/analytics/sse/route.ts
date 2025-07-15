import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Store active connections
const clients = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true }
  });

  if (!user || user.subscription?.status !== 'active') {
    return new Response('Analytics is a premium feature', { status: 403 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      clients.set(user.id, controller);

      // Send initial connection message
      const connectionData = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectionData));

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeatData));
        } catch (error) {
          clearInterval(heartbeat);
          clients.delete(user.id);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clients.delete(user.id);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Function to send analytics updates to specific users
export function sendAnalyticsUpdate(userId: string, update: any) {
  const controller = clients.get(userId);
  if (controller) {
    try {
      const data = `data: ${JSON.stringify({ 
        type: 'analytics-update', 
        update 
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      // Client disconnected, remove from map
      clients.delete(userId);
    }
  }
}

// Function to broadcast analytics updates to all connected users
export function broadcastAnalyticsUpdate(update: any) {
  clients.forEach((controller, userId) => {
    try {
      const data = `data: ${JSON.stringify({ 
        type: 'analytics-update', 
        update 
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      // Client disconnected, remove from map
      clients.delete(userId);
    }
  });
}