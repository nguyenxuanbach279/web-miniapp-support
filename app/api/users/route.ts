import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/server-db';
import { getUTC7Date, getUTC7Timestamp } from '@/lib/date-utils';
import { User, Role } from '@/lib/types';

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({ success: true, users: db.users });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi khi lấy danh sách người dùng!' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, role, avatarUrl } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Vui lòng điền tên và email!' }, { status: 400 });
    }

    const db = await readDB();
    const formattedEmail = email.trim().toLowerCase();

    if (db.users.some(u => u.email.toLowerCase() === formattedEmail)) {
      return NextResponse.json({ success: false, message: 'Email này đã được sử dụng!' }, { status: 409 });
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: formattedEmail,
      name: name.trim(),
      role: (role === 'admin' ? 'admin' : 'user') as Role,
      status: 'Active',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      createdAt: getUTC7Date(),
      lastLogin: getUTC7Timestamp()
    };

    db.users.unshift(newUser);
    db.passwords[formattedEmail] = 'User@123456!'; // Default password for manually created user

    await writeDB(db);

    return NextResponse.json({ success: true, user: newUser, message: 'Thêm thành viên thành công!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi thêm người dùng!' }, { status: 500 });
  }
}
