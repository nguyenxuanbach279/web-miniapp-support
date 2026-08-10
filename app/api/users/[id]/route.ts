import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/server-db';
import { UserStatus, Role } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await readDB();

    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng!' }, { status: 404 });
    }

    const isSuperAdmin = db.users[userIndex].email.toLowerCase() === 'nguyenxuanbach270901@gmail.com';

    if (body.status !== undefined) {
      if (isSuperAdmin && body.status === 'InActive') {
        return NextResponse.json({ success: false, message: 'Không thể khóa tài khoản Super Admin!' }, { status: 400 });
      }
      db.users[userIndex].status = body.status as UserStatus;
    }
    if (body.role !== undefined) {
      db.users[userIndex].role = body.role as Role;
    }

    await writeDB(db);

    return NextResponse.json({ success: true, user: db.users[userIndex], message: 'Cập nhật thông tin thành công!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi cập nhật người dùng!' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDB();

    const targetUser = db.users.find(u => u.id === id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng!' }, { status: 404 });
    }

    if (targetUser.email.toLowerCase() === 'nguyenxuanbach270901@gmail.com') {
      return NextResponse.json({ success: false, message: 'Không thể xóa tài khoản Super Admin!' }, { status: 400 });
    }

    db.users = db.users.filter(u => u.id !== id);
    delete db.passwords[targetUser.email];

    await writeDB(db);

    return NextResponse.json({ success: true, message: 'Xóa người dùng thành công!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi xóa người dùng!' }, { status: 500 });
  }
}
