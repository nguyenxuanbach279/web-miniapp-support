import { NextResponse } from 'next/server';
import { readNotificationsDB, writeNotificationsDB } from '@/lib/server-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const db = await readNotificationsDB();

    if (userId) {
      const userNotifs = db.notifications.filter(n => n.userId === userId);
      return NextResponse.json({ success: true, notifications: userNotifs });
    }

    return NextResponse.json({ success: true, notifications: db.notifications });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi đọc thông báo!' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, notifId, markAll } = await request.json();
    const db = await readNotificationsDB();

    if (markAll && userId) {
      db.notifications.forEach(n => {
        if (n.userId === userId) {
          n.read = true;
        }
      });
    } else if (notifId) {
      const target = db.notifications.find(n => n.id === notifId);
      if (target) {
        target.read = true;
      }
    }

    await writeNotificationsDB(db);
    return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái đọc thông báo!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi cập nhật thông báo!' }, { status: 500 });
  }
}
