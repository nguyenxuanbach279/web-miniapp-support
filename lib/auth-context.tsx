'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, UserStatus } from './types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  loadingUsers: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; code?: string; message: string }>;
  register: (name: string, email: string, pass: string, role?: Role) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  toggleUserStatus: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
  addUser: (newUser: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  deleteUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users from Server Backend API
  const refreshUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users from backend API:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshUsers();
    try {
      const storedSession = localStorage.getItem('app_current_user');
      if (storedSession) {
        setCurrentUser(JSON.parse(storedSession));
      }
    } catch (e) {
      console.error('Error reading session:', e);
    }
  }, []);

  // Save session state locally
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [currentUser]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        await refreshUsers();
        return { success: true, message: data.message || 'Đăng nhập thành công!' };
      } else {
        return { success: false, code: data.code, message: data.message || 'Đăng nhập thất bại!' };
      }
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối tới Backend server!' };
    }
  };

  const register = async (name: string, email: string, pass: string, role: Role = 'user') => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, role })
      });
      const data = await res.json();

      if (data.success && data.user) {
        await refreshUsers();
        return { success: true, message: data.message || 'Đăng ký thành công!' };
      } else {
        return { success: false, message: data.message || 'Đăng ký thất bại!' };
      }
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối tới Backend server!' };
    }
  };

  const forgotPassword = async (email: string, newPass: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: newPass })
      });
      const data = await res.json();

      if (data.success) {
        await refreshUsers();
        return { success: true, message: data.message || 'Đặt lại mật khẩu thành công!' };
      } else {
        return { success: false, message: data.message || 'Đổi mật khẩu thất bại!' };
      }
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối tới Backend server!' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const toggleUserStatus = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.email.toLowerCase() === 'nguyenxuanbach270901@gmail.com' && targetUser.status === 'Active') {
      console.warn('Super Admin account cannot be locked');
      return;
    }

    const nextStatus: UserStatus = targetUser.status === 'Active' ? 'InActive' : 'Active';

    // Optimistic UI update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, status: nextStatus } : null);
    }

    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      await refreshUsers();
    } catch (err) {
      console.error('Error toggling status on server:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: Role) => {
    // Optimistic UI update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
    }

    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      await refreshUsers();
    } catch (err) {
      console.error('Error updating role on server:', err);
    }
  };

  const addUser = async (newUser: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();

      if (data.success) {
        await refreshUsers();
        return { success: true, message: data.message || 'Thêm người dùng thành công!' };
      } else {
        return { success: false, message: data.message || 'Không thể thêm người dùng!' };
      }
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối tới Backend server!' };
    }
  };

  const deleteUser = async (userId: string) => {
    // Optimistic UI update
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }

    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      await refreshUsers();
    } catch (err) {
      console.error('Error deleting user on server:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loadingUsers,
        login,
        register,
        forgotPassword,
        logout,
        toggleUserStatus,
        updateUserRole,
        addUser,
        deleteUser,
        refreshUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
