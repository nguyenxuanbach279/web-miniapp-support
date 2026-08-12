export type Role = 'super_admin' | 'admin' | 'user';
export type UserStatus = 'Active' | 'InActive' | 'Pending';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface PasswordStrength {
  score: number;
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'pending-approval';

// Phone & Roles types
export type PhoneRole = 'poc' | 'prod' | 'full' | 'admin' | 'default';

export type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Done';

export type OrderType = 'phone&role' | 'sso';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: OrderType;
  rawText: string;
  detectedPhone: string;
  phoneRole: PhoneRole;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
  appName?: string;
  appId?: string;
  clientId?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  message: string;
  orderId: string;
  createdAt: string;
  read: boolean;
}

// SSO Registry Item type
export interface SSOItem {
  id: string;
  clientId: string;
  appId: string;
  appName: string;
  internalId: string;
  clientSecret: string;
  createdAt: string;
}

// App Installation Links type
export interface InstallLinkItem {
  id: string;
  title: string;
  urlOrVersion: string;
  updatedAt: string;
}
