import { NextResponse } from 'next/server';
import { readOrdersDB, writeOrdersDB, readNotificationsDB, writeNotificationsDB } from '@/lib/server-db';
import { getUTC7Timestamp } from '@/lib/date-utils';
import { UserNotification } from '@/lib/types';
import { notificationEmitter } from '@/lib/event-bus';

export async function POST(request: Request) {
  try {
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Vui lòng chọn ít nhất 1 đơn hàng để hoàn thành!' }, { status: 400 });
    }

    const ordersDb = await readOrdersDB();
    const notifsDb = await readNotificationsDB();

    const nowIso = new Date().toISOString();
    const nowUtc7 = getUTC7Timestamp();
    const completedOrders: string[] = [];

    ordersDb.orders.forEach(order => {
      if (orderIds.includes(order.id)) {
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

    await writeOrdersDB(ordersDb);
    await writeNotificationsDB(notifsDb);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật hoàn thành ${completedOrders.length} đơn hàng và bắn thông báo tới người dùng!`,
      completedOrderIds: completedOrders
    });
  } catch (error) {
    console.error('Error completing orders:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đơn hàng!' }, { status: 500 });
  }
}
