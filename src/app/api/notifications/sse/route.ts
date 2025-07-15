import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Store active connections
const clients = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this user
      clients.set(user.id, controller);

      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Send heartbeat every 10 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeatData));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 10000);
      
      // Auto-close connection after 4.5 minutes to avoid Vercel timeout
      const timeout = setTimeout(() => {
        try {
          const reconnectData = `data: ${JSON.stringify({ type: 'reconnect', timestamp: new Date() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(reconnectData));
          controller.close();
        } catch (error) {
          // Ignore errors
        }
        clearInterval(heartbeat);
        clients.delete(user.id);
      }, 270000); // 4.5 minutes

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clearTimeout(timeout);
        clients.delete(user.id);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, { headers });
}

// Helper function to send notification to a specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = clients.get(userId);
  if (controller) {
    try {
      const data = `data: ${JSON.stringify({ type: 'notification', notification })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      // Client disconnected, remove from map
      clients.delete(userId);
    }
  }
}