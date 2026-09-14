import { NextResponse } from 'next/server';
import { notificationEmitter } from '@/lib/event-bus';
import { readNotificationsDB } from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial notifications data
      try {
        const db = await readNotificationsDB();
        const userNotifs = db.notifications.filter(n => n.userId === userId);
        controller.enqueue(encoder.encode(`event: initial\ndata: ${JSON.stringify(userNotifs)}\n\n`));
      } catch (err) {
        console.error('Error reading initial notifications for SSE:', err);
      }

      // 2. Listen for real-time notification events
      const listener = (data: { userId: string; notification: any }) => {
        if (data.userId === userId) {
          try {
            controller.enqueue(encoder.encode(`event: new_notification\ndata: ${JSON.stringify(data.notification)}\n\n`));
          } catch (e) {
            // Stream controller might be closed
          }
        }
      };

      notificationEmitter.on('notification', listener);

      // 3. Heartbeat ping every 15s to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      // Auto close stream after 40s to prevent Vercel Serverless Function hanging & quota exhaustion
      const timeout = setTimeout(() => {
        try {
          notificationEmitter.removeListener('notification', listener);
          clearInterval(interval);
          controller.close();
        } catch {}
      }, 40000);

      // Cleanup on client disconnect / abort
      request.signal.addEventListener('abort', () => {
        notificationEmitter.removeListener('notification', listener);
        clearInterval(interval);
        clearTimeout(timeout);
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
