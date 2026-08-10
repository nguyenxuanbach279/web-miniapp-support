import fs from 'fs/promises';
import path from 'path';
import { User, Role, UserStatus, Order, SSOItem, UserNotification } from './types';

export interface DBData {
  users: User[];
  passwords: Record<string, string>;
}

export interface OrdersDBData {
  orders: Order[];
}

export interface SSODBData {
  ssoItems: SSOItem[];
}

export interface NotificationsDBData {
  notifications: UserNotification[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');
const ORDERS_DB_PATH = path.join(process.cwd(), 'data', 'orders.json');
const SSO_DB_PATH = path.join(process.cwd(), 'data', 'sso.json');
const NOTIF_DB_PATH = path.join(process.cwd(), 'data', 'notifications.json');

const DEFAULT_DB: DBData = {
  users: [
    {
      id: 'usr_admin_bach',
      email: 'nguyenxuanbach270901@gmail.com',
      name: 'Nguyễn Xuân Bách',
      role: 'admin',
      status: 'Active',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      createdAt: '2026-08-10',
      lastLogin: '2026-08-10 08:59'
    }
  ],
  passwords: {
    'nguyenxuanbach270901@gmail.com': 'Bach270901@'
  }
};

const DEFAULT_ORDERS_DB: OrdersDBData = {
  orders: [
    {
      id: 'ord_1770690000000',
      userId: 'usr_admin_bach',
      userEmail: 'nguyenxuanbach270901@gmail.com',
      userName: 'Nguyễn Xuân Bách',
      type: 'phone&role',
      rawText: 'Đăng ký số điện thoại 0972390426 với quyền full',
      detectedPhone: '0972390426',
      phoneRole: 'full',
      status: 'Pending',
      createdAt: '2026-08-10 09:30'
    }
  ]
};

const DEFAULT_SSO_DB: SSODBData = {
  ssoItems: [
    {
      id: 'sso_1770690000000',
      clientId: 'super-app-client',
      appId: '1512079453994241503232',
      appName: 'quản lý thiết bị poc',
      internalId: '12312312321312312',
      clientSecret: '12321321312312312',
      createdAt: '2026-08-10 10:00'
    }
  ]
};

export async function readDB(): Promise<DBData> {
  try {
    const dataStr = await fs.readFile(DB_PATH, 'utf-8');
    const parsed: DBData = JSON.parse(dataStr);

    if (!parsed.users.some(u => u.email.toLowerCase() === 'nguyenxuanbach270901@gmail.com')) {
      parsed.users.unshift(DEFAULT_DB.users[0]);
      parsed.passwords['nguyenxuanbach270901@gmail.com'] = 'Bach270901@';
      await writeDB(parsed);
    }

    return parsed;
  } catch (error) {
    await writeDB(DEFAULT_DB);
    return DEFAULT_DB;
  }
}

export async function writeDB(data: DBData): Promise<void> {
  const dir = path.dirname(DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing server database:', err);
  }
}

export async function readOrdersDB(): Promise<OrdersDBData> {
  try {
    const dataStr = await fs.readFile(ORDERS_DB_PATH, 'utf-8');
    const db: OrdersDBData = JSON.parse(dataStr);

    // Auto cleanup phone&role orders that are Done and older than 24 hours (1 day)
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    let modified = false;

    const remainingOrders = db.orders.filter(order => {
      const isPhoneRole = (order.type || 'phone&role') === 'phone&role';
      const isDone = order.status === 'Done';

      if (isPhoneRole && isDone && order.completedAt) {
        const completedMs = new Date(order.completedAt).getTime();
        if (!isNaN(completedMs) && (now - completedMs >= ONE_DAY_MS)) {
          modified = true;
          return false; // Automatically delete this done phone&role order
        }
      }
      return true;
    });

    if (modified) {
      db.orders = remainingOrders;
      await writeOrdersDB(db);
    }

    return db;
  } catch (error) {
    await writeOrdersDB(DEFAULT_ORDERS_DB);
    return DEFAULT_ORDERS_DB;
  }
}

export async function writeOrdersDB(data: OrdersDBData): Promise<void> {
  const dir = path.dirname(ORDERS_DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(ORDERS_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders database:', err);
  }
}

export async function readSSODB(): Promise<SSODBData> {
  try {
    const dataStr = await fs.readFile(SSO_DB_PATH, 'utf-8');
    return JSON.parse(dataStr);
  } catch (error) {
    await writeSSODB(DEFAULT_SSO_DB);
    return DEFAULT_SSO_DB;
  }
}

export async function writeSSODB(data: SSODBData): Promise<void> {
  const dir = path.dirname(SSO_DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SSO_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing SSO database:', err);
  }
}

export async function readNotificationsDB(): Promise<NotificationsDBData> {
  try {
    const dataStr = await fs.readFile(NOTIF_DB_PATH, 'utf-8');
    const db: NotificationsDBData = JSON.parse(dataStr);

    // Auto-delete notifications older than 7 days (1 week)
    const now = Date.now();
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const originalCount = db.notifications.length;

    db.notifications = db.notifications.filter(n => {
      let createdMs = 0;
      if (n.id && n.id.startsWith('notif_')) {
        const parts = n.id.split('_');
        if (parts[1]) {
          const ts = parseInt(parts[1], 10);
          if (!isNaN(ts) && ts > 1600000000000) createdMs = ts;
        }
      }
      if (!createdMs && n.createdAt) {
        const parsed = new Date(n.createdAt).getTime();
        if (!isNaN(parsed)) createdMs = parsed;
      }
      if (createdMs > 0 && (now - createdMs >= ONE_WEEK_MS)) return false;
      return true;
    });

    if (db.notifications.length !== originalCount) {
      await writeNotificationsDB(db);
    }

    return db;
  } catch (error) {
    const defaultData: NotificationsDBData = { notifications: [] };
    await writeNotificationsDB(defaultData);
    return defaultData;
  }
}

export async function writeNotificationsDB(data: NotificationsDBData): Promise<void> {
  const dir = path.dirname(NOTIF_DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(NOTIF_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing notifications database:', err);
  }
}
