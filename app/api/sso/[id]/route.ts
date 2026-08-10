import { NextResponse } from 'next/server';
import { readSSODB, writeSSODB } from '@/lib/server-db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await readSSODB();

    const itemIndex = db.ssoItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return NextResponse.json({ success: false, message: 'SSO Item not found' }, { status: 404 });
    }

    const currentItem = db.ssoItems[itemIndex];

    if (body.clientId) currentItem.clientId = body.clientId.trim();
    if (body.appId) currentItem.appId = body.appId.trim();
    if (body.appName) currentItem.appName = body.appName.trim();
    if (body.internalId) currentItem.internalId = body.internalId.trim();
    if (body.clientSecret) currentItem.clientSecret = body.clientSecret.trim();

    await writeSSODB(db);

    return NextResponse.json({
      success: true,
      ssoItem: currentItem,
      message: 'SSO Item updated successfully!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error updating SSO item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readSSODB();

    const itemIndex = db.ssoItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return NextResponse.json({ success: false, message: 'SSO Item not found' }, { status: 404 });
    }

    db.ssoItems = db.ssoItems.filter(item => item.id !== id);
    await writeSSODB(db);

    return NextResponse.json({
      success: true,
      message: 'SSO Item deleted successfully!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error deleting SSO item' }, { status: 500 });
  }
}
