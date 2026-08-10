import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/server-db';
import { isPasswordStrong } from '@/lib/password-utils';

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp Email và Mật khẩu mới!' }, { status: 400 });
    }

    if (!isPasswordStrong(newPassword)) {
      return NextResponse.json({ success: false, message: 'Mật khẩu mới phải đáp ứng các yêu cầu bảo mật mật khẩu mạnh!' }, { status: 400 });
    }

    const db = await readDB();
    const formattedEmail = email.trim().toLowerCase();
    const foundUser = db.users.find(u => u.email.toLowerCase() === formattedEmail);

    if (!foundUser) {
      return NextResponse.json({ success: false, message: 'Email không tồn tại trong hệ thống!' }, { status: 404 });
    }

    db.passwords[formattedEmail] = newPassword;
    db.passwords[foundUser.email] = newPassword;
    await writeDB(db);

    return NextResponse.json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi đổi mật khẩu!' }, { status: 500 });
  }
}
