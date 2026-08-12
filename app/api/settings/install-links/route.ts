import { NextResponse } from 'next/server';
import { readInstallLinksDB, writeInstallLinksDB } from '@/lib/server-db';
import { getUTC7Timestamp } from '@/lib/date-utils';
import { InstallLinkItem } from '@/lib/types';

export async function GET() {
  try {
    const db = await readInstallLinksDB();
    return NextResponse.json({ success: true, installLinks: db.installLinks });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch install links' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, urlOrVersion } = body;

    if (!title || !urlOrVersion) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập Tên/Mô tả và Đường dẫn/Phiên bản!' },
        { status: 400 }
      );
    }

    const db = await readInstallLinksDB();
    const newLink: InstallLinkItem = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      urlOrVersion: String(urlOrVersion).trim(),
      updatedAt: getUTC7Timestamp()
    };

    db.installLinks.unshift(newLink);
    await writeInstallLinksDB(db);

    return NextResponse.json({
      success: true,
      installLink: newLink,
      installLinks: db.installLinks,
      message: 'Thêm đường dẫn/bản cài mới thành công!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi thêm đường dẫn cài đặt!' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, urlOrVersion } = body;

    if (!id || !title || !urlOrVersion) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin id, title hoặc urlOrVersion!' },
        { status: 400 }
      );
    }

    const db = await readInstallLinksDB();
    const index = db.installLinks.findIndex(l => l.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy mục cần sửa!' }, { status: 404 });
    }

    db.installLinks[index] = {
      ...db.installLinks[index],
      title: String(title).trim(),
      urlOrVersion: String(urlOrVersion).trim(),
      updatedAt: getUTC7Timestamp()
    };

    await writeInstallLinksDB(db);

    return NextResponse.json({
      success: true,
      installLink: db.installLinks[index],
      installLinks: db.installLinks,
      message: 'Cập nhật đường dẫn cài đặt thành công!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi cập nhật đường dẫn cài đặt!' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu id mục cần xóa!' }, { status: 400 });
    }

    const db = await readInstallLinksDB();
    db.installLinks = db.installLinks.filter(l => l.id !== id);
    await writeInstallLinksDB(db);

    return NextResponse.json({
      success: true,
      installLinks: db.installLinks,
      message: 'Đã xóa đường dẫn cài đặt!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi xóa đường dẫn cài đặt!' }, { status: 500 });
  }
}
