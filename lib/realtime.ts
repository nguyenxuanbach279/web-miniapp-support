import { Order, UserNotification } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

/**
 * Broadcast an event via Supabase Realtime REST API.
 * Uses HTTP POST to relay real-time events through Supabase WebSocket cluster.
 * Does NOT hold open any serverless connection on Vercel (takes ~20-50ms).
 */
export async function broadcastRealtimeEvent(channelName: string, event: string, payload: Record<string, unknown>): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Realtime] Supabase URL or Key is missing. Skipping broadcast.');
    return;
  }

  const cleanUrl = supabaseUrl.replace(/\/$/, '');

  try {
    const response = await fetch(`${cleanUrl}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `realtime:${channelName}`,
            event,
            payload,
          },
          {
            topic: channelName,
            event,
            payload,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`[Realtime Broadcast] Failed (${response.status}):`, text);
    }
  } catch (error) {
    console.error('[Realtime Broadcast] Error sending event:', error);
  }
}

/**
 * Broadcast when a new order is created.
 * Mobile app receives the full order payload instantly without needing to poll or fetch GET /api/orders.
 */
export async function broadcastNewOrder(order: Order): Promise<void> {
  await broadcastRealtimeEvent('orders', 'new_order', {
    order,
    orderId: order.id,
    type: order.type,
    detectedPhone: order.detectedPhone,
    phoneRole: order.phoneRole,
    rawText: order.rawText,
    userName: order.userName,
    userEmail: order.userEmail,
    createdAt: order.createdAt,
  });
}

/**
 * Broadcast when an order is completed.
 */
export async function broadcastOrderCompleted(orderId: string, order?: Order): Promise<void> {
  await broadcastRealtimeEvent('orders', 'order_completed', {
    orderId,
    order,
  });
}

/**
 * Broadcast a new notification to web client.
 */
export async function broadcastNotification(userId: string, notification: UserNotification): Promise<void> {
  await broadcastRealtimeEvent(`user_${userId}`, 'new_notification', {
    userId,
    notification,
  });
  // Also broadcast to general notifications channel
  await broadcastRealtimeEvent('notifications', 'new_notification', {
    userId,
    notification,
  });
}
