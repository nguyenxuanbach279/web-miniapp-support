import { NextResponse } from 'next/server';
import { readOrdersDB, writeOrdersDB, readNotificationsDB, writeNotificationsDB, readDB } from '@/lib/server-db';
import { getUTC7Timestamp } from '@/lib/date-utils';
import { UserNotification } from '@/lib/types';
import { notificationEmitter } from '@/lib/event-bus';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    // Basic Auth Check (optional if called from session, required if called with Basic Auth header)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      let email = '';
      let password = '';
      try {
        const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
        const colonIndex = credentials.indexOf(':');
        if (colonIndex !== -1) {
          email = credentials.substring(0, colonIndex).trim().toLowerCase();
          password = credentials.substring(colonIndex + 1);
        }
      } catch (err) {
        return NextResponse.json({ success: false, message: 'Invalid Basic Auth format' }, { status: 400 });
      }

      const userDb = await readDB();
      const user = userDb.users.find(u => u.email.toLowerCase() === email);
      const expectedPass = user ? (userDb.passwords[user.email] || userDb.passwords[email]) : null;

      if (!user || user.status !== 'Active' || user.role !== 'admin' || password !== expectedPass) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Email hoặc Mật khẩu Admin không chính xác!' },
          { status: 401 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    let targetOrderIds: string[] = [];

    if (Array.isArray(body.orderIds)) {
      targetOrderIds = body.orderIds.filter(Boolean);
    } else if (typeof body.orderId === 'string' && body.orderId.trim()) {
      targetOrderIds = [body.orderId.trim()];
    } else if (typeof body.id === 'string' && body.id.trim()) {
      targetOrderIds = [body.id.trim()];
    }

    if (targetOrderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng truyền orderId hoặc orderIds!' },
        { status: 400 }
      );
    }

    const ordersDb = await readOrdersDB();
    const notifsDb = await readNotificationsDB();

    const nowIso = new Date().toISOString();
    const nowUtc7 = getUTC7Timestamp();
    const completedOrders: string[] = [];

    ordersDb.orders.forEach(order => {
      if (targetOrderIds.includes(order.id) && order.status !== 'Done') {
        order.status = 'Done';
        order.completedAt = nowIso;
        completedOrders.push(order.id);

        // Bắn thông báo về cho người dùng đã tạo order
        const notif: UserNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: order.userId,
          userEmail: order.userEmail,
          title: 'Đơn hàng đã hoàn thành',
          message: `Đơn hàng ${order.id} (${order.type === 'sso' ? (order.appName || 'SSO Registry') : order.detectedPhone}) của bạn đã được Admin hoàn thành!`,
          orderId: order.id,
          createdAt: nowUtc7,
          read: false
        };
        notifsDb.notifications.unshift(notif);

        // Emit SSE real-time event
        notificationEmitter.emit('notification', {
          userId: order.userId,
          notification: notif
        });
      }
    });

    if (completedOrders.length > 0) {
      await writeOrdersDB(ordersDb);
      await writeNotificationsDB(notifsDb);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Đã cập nhật hoàn thành ${completedOrders.length} đơn hàng!`,
        completedOrderIds: completedOrders
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error completing orders:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đơn hàng!' }, { status: 500 });
  }
}
