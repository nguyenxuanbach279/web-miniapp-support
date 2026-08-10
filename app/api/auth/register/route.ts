import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/server-db';
import { isPasswordStrong } from '@/lib/password-utils';
import { getUTC7Date, getUTC7Timestamp } from '@/lib/date-utils';
import { User, Role } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!' }, { status: 400 });
    }

    if (!isPasswordStrong(password)) {
      return NextResponse.json({ success: false, message: 'Mật khẩu phải đạt chuẩn mật khẩu mạnh!' }, { status: 400 });
    }

    const db = await readDB();
    const formattedEmail = email.trim().toLowerCase();

    if (db.users.some(u => u.email.toLowerCase() === formattedEmail)) {
      return NextResponse.json({ success: false, message: 'Email này đã tồn tại trong hệ thống!' }, { status: 409 });
    }

    const userRole: Role = role === 'admin' ? 'admin' : 'user';

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: formattedEmail,
      name: name.trim(),
      role: userRole,
      status: 'Pending',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      createdAt: getUTC7Date(),
      lastLogin: getUTC7Timestamp()
    };

    db.users.unshift(newUser);
    db.passwords[formattedEmail] = password;

    await writeDB(db);

    return NextResponse.json({ success: true, user: newUser, message: 'Đăng ký tài khoản thành công! Đang ở màn hình chờ Admin duyệt, hãy liên hệ Admin!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi đăng ký tài khoản!' }, { status: 500 });
  }
}
