import fs from 'fs/promises';
import path from 'path';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
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

// --- SUPABASE CLIENT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function getSupabaseData<T>(key: string): Promise<T | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_store')
      .select('data')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) return null;
    return data.data as T;
  } catch (err) {
    console.error(`Error reading from Supabase (${key}):`, err);
    return null;
  }
}

async function setSupabaseData<T>(key: string, data: T): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('app_store')
      .upsert({ key, data, updated_at: new Date().toISOString() });
  } catch (err) {
    console.error(`Error writing to Supabase (${key}):`, err);
  }
}

// --- REDIS CLIENT (FALLBACK) ---
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.VERCEL_KV_REST_API_URL ||
  process.env.REST_API_URL;

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.VERCEL_KV_REST_API_TOKEN ||
  process.env.REST_API_TOKEN;

const redis = (redisUrl && redisToken)
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const DEFAULT_DB: DBData = {
  users: [
    {
      id: 'usr_1786336501792',
      email: 'nguyenxuanbach27092001@gmail.com',
      name: 'Nguyễn Xuân Bách',
      role: 'admin',
      status: 'Active',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nguy%E1%BB%85n%20Xu%C3%A2n%20B%C3%A1ch',
      createdAt: '2026-08-10',
      lastLogin: '2026-08-10 13:50'
    },
    {
      id: 'usr_admin_bach',
      email: 'nguyenxuanbach270901@gmail.com',
      name: 'Nguyễn Xuân Bách',
      role: 'admin',
      status: 'Active',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      createdAt: '2026-08-10',
      lastLogin: '2026-08-10 12:34'
    }
  ],
  passwords: {
    'nguyenxuanbach270901@gmail.com': 'Bach270901@',
    'nguyenxuanbach27092001@gmail.com': 'Bach270901@'
  }
};

const DEFAULT_ORDERS_DB: OrdersDBData = {
  orders: []
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

// --- USERS DB ---
export async function readDB(): Promise<DBData> {
  let db: DBData | null = await getSupabaseData<DBData>('app_users');

  if (!db && redis) {
    try {
      db = await redis.get<DBData>('app_users');
    } catch (err) {
      console.error('Error reading from Redis (users):', err);
    }
  }

  if (!db || !Array.isArray(db.users)) {
    try {
      const dataStr = await fs.readFile(DB_PATH, 'utf-8');
      db = JSON.parse(dataStr);
    } catch (error) {
      db = DEFAULT_DB;
    }
    if (!db || !Array.isArray(db.users)) {
      db = DEFAULT_DB;
    }
    if (supabase) await setSupabaseData('app_users', db);
    if (redis) {
      try { await redis.set('app_users', db); } catch {}
    }
  }

  let modified = false;
  if (!db.users.some(u => u.email.toLowerCase() === 'nguyenxuanbach270901@gmail.com')) {
    db.users.unshift(DEFAULT_DB.users[1]);
    db.passwords['nguyenxuanbach270901@gmail.com'] = 'Bach270901@';
    modified = true;
  }
  if (!db.users.some(u => u.email.toLowerCase() === 'nguyenxuanbach27092001@gmail.com')) {
    db.users.unshift(DEFAULT_DB.users[0]);
    db.passwords['nguyenxuanbach27092001@gmail.com'] = 'Bach270901@';
    modified = true;
  }
  if (modified) {
    await writeDB(db);
  }

  return db;
}

export async function writeDB(data: DBData): Promise<void> {
  if (supabase) {
    await setSupabaseData('app_users', data);
  }
  if (redis) {
    try {
      await redis.set('app_users', data);
    } catch (err) {
      console.error('Error writing to Redis (users):', err);
    }
  }

  const dir = path.dirname(DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore read-only fs error on Vercel
  }
}

// --- ORDERS DB ---
export async function readOrdersDB(): Promise<OrdersDBData> {
  let db: OrdersDBData | null = await getSupabaseData<OrdersDBData>('app_orders');

  if (!db && redis) {
    try {
      db = await redis.get<OrdersDBData>('app_orders');
    } catch (err) {
      console.error('Error reading from Redis (orders):', err);
    }
  }

  if (!db || !Array.isArray(db.orders)) {
    try {
      const dataStr = await fs.readFile(ORDERS_DB_PATH, 'utf-8');
      db = JSON.parse(dataStr);
    } catch (error) {
      db = DEFAULT_ORDERS_DB;
    }
    if (!db || !Array.isArray(db.orders)) {
      db = DEFAULT_ORDERS_DB;
    }
    if (supabase) await setSupabaseData('app_orders', db);
    if (redis) {
      try { await redis.set('app_orders', db); } catch {}
    }
  }

  // Clean up initial mock order if present
  if (db && Array.isArray(db.orders) && db.orders.some(o => o.id === 'ord_1770690000000')) {
    db.orders = db.orders.filter(o => o.id !== 'ord_1770690000000');
    modified = true;
  }

  const remainingOrders = db.orders.filter(order => {
    const isPhoneRole = (order.type || 'phone&role') === 'phone&role';
    const isDone = order.status === 'Done';

    if (isPhoneRole && isDone && order.completedAt) {
      const completedMs = new Date(order.completedAt).getTime();
      if (!isNaN(completedMs) && (now - completedMs >= ONE_DAY_MS)) {
        modified = true;
        return false;
      }
    }
    return true;
  });

  if (modified) {
    db.orders = remainingOrders;
    await writeOrdersDB(db);
  }

  return db;
}

export async function writeOrdersDB(data: OrdersDBData): Promise<void> {
  if (supabase) {
    await setSupabaseData('app_orders', data);
  }
  if (redis) {
    try {
      await redis.set('app_orders', data);
    } catch (err) {
      console.error('Error writing to Redis (orders):', err);
    }
  }

  const dir = path.dirname(ORDERS_DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(ORDERS_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore read-only fs error on Vercel
  }
}

// --- SSO DB ---
export async function readSSODB(): Promise<SSODBData> {
  let db: SSODBData | null = await getSupabaseData<SSODBData>('app_sso');

  if (!db && redis) {
    try {
      db = await redis.get<SSODBData>('app_sso');
    } catch (err) {
      console.error('Error reading from Redis (sso):', err);
    }
  }

  if (!db || !Array.isArray(db.ssoItems)) {
    try {
      const dataStr = await fs.readFile(SSO_DB_PATH, 'utf-8');
      db = JSON.parse(dataStr);
    } catch (error) {
      db = DEFAULT_SSO_DB;
    }
    if (!db || !Array.isArray(db.ssoItems)) {
      db = DEFAULT_SSO_DB;
    }
    if (supabase) await setSupabaseData('app_sso', db);
    if (redis) {
      try { await redis.set('app_sso', db); } catch {}
    }
  }

  return db;
}

export async function writeSSODB(data: SSODBData): Promise<void> {
  if (supabase) {
    await setSupabaseData('app_sso', data);
  }
  if (redis) {
    try {
      await redis.set('app_sso', data);
    } catch (err) {
      console.error('Error writing to Redis (sso):', err);
    }
  }

  const dir = path.dirname(SSO_DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SSO_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore read-only fs error on Vercel
  }
}

// --- NOTIFICATIONS DB ---
export async function readNotificationsDB(): Promise<NotificationsDBData> {
  let db: NotificationsDBData | null = await getSupabaseData<NotificationsDBData>('app_notifications');

  if (!db && redis) {
    try {
      db = await redis.get<NotificationsDBData>('app_notifications');
    } catch (err) {
      console.error('Error reading from Redis (notifications):', err);
    }
  }

  if (!db || !Array.isArray(db.notifications)) {
    try {
      const dataStr = await fs.readFile(NOTIF_DB_PATH, 'utf-8');
      db = JSON.parse(dataStr);
    } catch (error) {
      db = { notifications: [] };
    }
    if (!db || !Array.isArray(db.notifications)) {
      db = { notifications: [] };
    }
    if (supabase) await setSupabaseData('app_notifications', db);
    if (redis) {
      try { await redis.set('app_notifications', db); } catch {}
    }
  }

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
}

export async function writeNotificationsDB(data: NotificationsDBData): Promise<void> {
  if (supabase) {
    await setSupabaseData('app_notifications', data);
  }
  if (redis) {
    try {
      await redis.set('app_notifications', data);
    } catch (err) {
      console.error('Error writing to Redis (notifications):', err);
    }
  }

  const dir = path.dirname(NOTIF_DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(NOTIF_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore read-only fs error on Vercel
  }
}
