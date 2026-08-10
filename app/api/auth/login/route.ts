import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/server-db';
import { getUTC7Timestamp } from '@/lib/date-utils';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu!' }, { status: 400 });
    }

    const db = await readDB();
    const formattedEmail = email.trim().toLowerCase();
    const foundUser = db.users.find(u => u.email.toLowerCase() === formattedEmail);

    if (!foundUser) {
      return NextResponse.json({ success: false, message: 'Email này chưa được đăng ký tài khoản!' }, { status: 404 });
    }

    if (foundUser.status === 'InActive') {
      return NextResponse.json({ success: false, code: 'LOCKED', message: 'Bạn đã bị khóa tài khoản hãy liên hệ admin' }, { status: 403 });
    }

    if (foundUser.status === 'Pending') {
      return NextResponse.json({ success: false, code: 'PENDING', message: 'Màn hình chờ admin duyệt hãy liên hệ admin' }, { status: 403 });
    }

    const expectedPass = db.passwords[foundUser.email] || db.passwords[formattedEmail];
    if (password !== expectedPass) {
      return NextResponse.json({ success: false, message: 'Mật khẩu nhập vào không chính xác!' }, { status: 401 });
    }

    // Update last login in UTC+7 timezone
    foundUser.lastLogin = getUTC7Timestamp();
    await writeDB(db);

    return NextResponse.json({ success: true, user: foundUser, message: 'Đăng nhập thành công!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi đăng nhập!' }, { status: 500 });
  }
}
