import { NextResponse } from 'next/server';
import { readOrdersDB, writeOrdersDB } from '@/lib/server-db';
import { extractAllPhoneNumbers } from '@/lib/phone-utils';
import { OrderStatus, PhoneRole } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readOrdersDB();
    const order = db.orders.find(o => o.id === id);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Đơn hàng không tồn tại hoặc đã bị xóa tự động!' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi server khi lấy chi tiết đơn hàng!' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await readOrdersDB();

    const orderIndex = db.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ success: false, message: 'Order not found!' }, { status: 404 });
    }

    const currentOrder = db.orders[orderIndex];

    if (body.rawText !== undefined) {
      currentOrder.rawText = body.rawText.trim();
      const detected = extractAllPhoneNumbers(body.rawText);
      if (detected) {
        currentOrder.detectedPhone = detected;
      }
    }

    if (body.phoneRole !== undefined) {
      currentOrder.phoneRole = body.phoneRole as PhoneRole;
    }

    if (body.status !== undefined) {
      currentOrder.status = body.status as OrderStatus;
    }

    await writeOrdersDB(db);

    return NextResponse.json({
      success: true,
      order: currentOrder,
      message: 'Order updated successfully!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error updating order!' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readOrdersDB();

    const orderIndex = db.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ success: false, message: 'Order not found!' }, { status: 404 });
    }

    db.orders = db.orders.filter(o => o.id !== id);
    await writeOrdersDB(db);

    return NextResponse.json({ success: true, message: 'Order deleted successfully!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error deleting order!' }, { status: 500 });
  }
}
