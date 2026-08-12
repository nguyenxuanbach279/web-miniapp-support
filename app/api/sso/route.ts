import { NextResponse } from 'next/server';
import { readSSODB, writeSSODB, readOrdersDB, writeOrdersDB } from '@/lib/server-db';
import { getUTC7Timestamp } from '@/lib/date-utils';
import { SSOItem, Order } from '@/lib/types';

export async function GET() {
  try {
    const db = await readSSODB();
    return NextResponse.json({ success: true, ssoItems: db.ssoItems });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch SSO items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readSSODB();

    // Mode 1: Import Array of items from System Settings JSON text
    if (body.mode === 'import' && Array.isArray(body.items)) {
      const newItems: SSOItem[] = [];

      for (const item of body.items) {
        if (!item.clientId || !item.appId || !item.appName) {
          continue;
        }

        const ssoItem: SSOItem = {
          id: `sso_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          clientId: String(item.clientId).trim(),
          appId: String(item.appId).trim(),
          appName: String(item.appName).trim(),
          internalId: item.internalId ? String(item.internalId).trim() : Math.random().toString().substring(2, 18),
          clientSecret: item.clientSecret ? String(item.clientSecret).trim() : Math.random().toString(36).substring(2, 18),
          createdAt: getUTC7Timestamp()
        };

        newItems.push(ssoItem);
      }

      if (newItems.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No valid SSO items found in JSON array!'
        }, { status: 400 });
      }

      // Prepend new imported items
      db.ssoItems = [...newItems, ...db.ssoItems];
      await writeSSODB(db);

      return NextResponse.json({
        success: true,
        importedCount: newItems.length,
        ssoItems: db.ssoItems,
        message: `Successfully imported ${newItems.length} SSO Registry items!`
      });
    }

    // Mode 2: Register single SSO Item via Form
    const { clientId, appId, appName, environment, userId, userEmail, userName } = body;

    if (!clientId || !appId || !appName) {
      return NextResponse.json({
        success: false,
        message: 'Missing required SSO fields (Client ID, MiniApp ID, MiniApp Name)!'
      }, { status: 400 });
    }

    const envSuffix = environment === 'prod' ? 'prod' : 'poc';
    const cleanAppName = appName.trim();
    // Append poc or prod if not already appended
    const fullAppName = cleanAppName.toLowerCase().endsWith(envSuffix)
      ? cleanAppName
      : `${cleanAppName} ${envSuffix}`;

    // Note: Per requirements, registering an SSO order does NOT automatically add it to the ssoItems list.
    // The SSO items list ONLY changes when super admin updates it in System Settings.
    let createdOrder: Order | null = null;
    try {
      const ordersDb = await readOrdersDB();
      createdOrder = {
        id: `ord_${Date.now()}`,
        userId: userId || 'usr_admin_bach',
        userEmail: userEmail || 'nguyenxuanbach270901@gmail.com',
        userName: userName || 'Nguyễn Xuân Bách',
        type: 'sso',
        appName: fullAppName,
        appId: appId.trim(),
        clientId: clientId.trim(),
        rawText: `Đăng ký SSO: ${fullAppName} (MiniApp ID: ${appId.trim()}, Client ID: ${clientId.trim()})`,
        detectedPhone: '-',
        phoneRole: environment === 'prod' ? 'prod' : 'poc',
        status: 'Pending',
        createdAt: getUTC7Timestamp()
      };
      ordersDb.orders.unshift(createdOrder);
      await writeOrdersDB(ordersDb);
    } catch (orderErr) {
      console.error('Error creating corresponding order for SSO registration:', orderErr);
    }

    return NextResponse.json({
      success: true,
      order: createdOrder,
      message: 'Yêu cầu đăng ký SSO đã tạo đơn thành công!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error registering SSO' }, { status: 500 });
  }
}
