import { NextResponse } from 'next/server';
import { readOrdersDB, readDB } from '@/lib/server-db';
import { Order } from '@/lib/types';

function getSSOExportFields(o: Order) {
  let appName = o.appName || '';
  let appId = o.appId || '';
  let clientId = o.clientId || '';

  if (!appName || !appId || !clientId) {
    const match = o.rawText.match(/Đăng ký SSO:\s*(.*?)\s*\(MiniApp ID:\s*(.*?), Client ID:\s*(.*?)\)/i);
    if (match) {
      if (!appName) appName = match[1];
      if (!appId) appId = match[2];
      if (!clientId) clientId = match[3];
    }
  }

  return { appName, appId, clientId };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Standard HTTP Basic Auth (Authorization: Basic base64(username:password))
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Yêu cầu xác thực HTTP Basic Auth (Authorization: Basic <base64(email:password)>)' },
        {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Orders Export API"' }
        }
      );
    }

    let email = '';
    let password = '';
    try {
      const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
      const colonIndex = credentials.indexOf(':');
      if (colonIndex !== -1) {
        email = credentials.substring(0, colonIndex).trim().toLowerCase();
        password = credentials.substring(colonIndex + 1);
      }
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid Basic Auth format' }, { status: 400 });
    }

    // Verify Admin credentials against server database
    const userDb = await readDB();
    const user = userDb.users.find(u => u.email.toLowerCase() === email);
    const expectedPass = user ? (userDb.passwords[user.email] || userDb.passwords[email]) : null;

    if (!user || user.status !== 'Active' || user.role !== 'admin' || password !== expectedPass) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Email hoặc Mật khẩu Admin không chính xác!' },
        { status: 401 }
      );
    }

    const typeFilter = searchParams.get('type'); // optional: 'sso' | 'phone&role'

    const db = await readOrdersDB();
    let orders = db.orders.filter(o => o.status?.toLowerCase() === 'pending');

    if (typeFilter) {
      orders = orders.filter(o => (o.type || 'phone&role') === typeFilter);
    }

    const ssoOrders = orders.filter(o => o.type === 'sso');
    const phoneOrders = orders.filter(o => (o.type || 'phone&role') === 'phone&role');

    // --- SSO items: { orderId, type, clientId, miniappId, miniappName } ---
    const ssoItems = ssoOrders.map(o => {
      const { appName, appId, clientId } = getSSOExportFields(o);
      return {
        orderId: o.id,
        type: 'sso',
        clientId: clientId || o.clientId || '-',
        miniappId: appId || o.appId || '-',
        miniappName: appName || o.appName || '-'
      };
    });

    // --- Phone&Role: expand to 1 item per phone number, deduplicate by newest order ---
    const sortedPhoneOrders = [...phoneOrders].sort((a, b) => {
      const tsA = parseInt(a.id.replace('ord_', ''), 10) || 0;
      const tsB = parseInt(b.id.replace('ord_', ''), 10) || 0;
      return tsB - tsA; // newest first
    });

    const phoneMap = new Map<string, object>();
    for (const o of sortedPhoneOrders) {
      const phones = (o.detectedPhone || '').split(',').map(p => p.trim()).filter(Boolean);
      for (const phone of phones) {
        if (!phoneMap.has(phone)) {
          phoneMap.set(phone, {
            orderId: o.id,
            type: 'phone&role',
            phoneNumber: phone,
            role: o.phoneRole
          });
        }
      }
    }

    const phoneItems = Array.from(phoneMap.values());
    const result = [...ssoItems, ...phoneItems];

    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Allow CORS so external apps can fetch
      }
    });
  } catch (error) {
    console.error('Error exporting orders JSON:', error);
    return NextResponse.json({ error: 'Failed to export orders data' }, { status: 500 });
  }
}
