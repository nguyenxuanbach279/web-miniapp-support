'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { UserOverview } from './UserOverview';
import { MemberManagement } from './MemberManagement';
import { UserApproval } from './UserApproval';
import { PhoneRolesForm } from './PhoneRolesForm';
import { OrdersManagement } from './OrdersManagement';
import { SSORegistry } from './SSORegistry';
import { SystemSettings } from './SystemSettings';
import { UserNotification, Order } from '@/lib/types';
import { useToast } from '@/lib/toast-context';
import { OrderDetailModal } from './OrderDetailModal';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Phone,
  ShoppingBag,
  ShieldCheck,
  CheckCheck,
  Eye
} from 'lucide-react';

import { translations } from '@/lib/translations';

export const DashboardLayout: React.FC = () => {
  const { currentUser, users, logout } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'approval' | 'phone-roles' | 'orders' | 'sso-registry' | 'profile' | 'settings'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Order Detail Modal state
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Update Web document.title to strictly be the active menu name translated in active language
  useEffect(() => {
    const tabMap: Record<typeof activeTab, keyof typeof translations.en> = {
      'overview': 'overviewTab',
      'members': 'memberManagementTab',
      'approval': 'approvalTab',
      'phone-roles': 'phoneRolesTab',
      'orders': 'ordersTab',
      'sso-registry': 'ssoRegistryTab',
      'profile': 'profileTab',
      'settings': 'settingsTab',
    };
    const titleKey = tabMap[activeTab] || 'overviewTab';
    document.title = t(titleKey);
  }, [activeTab, language, t]);

  useEffect(() => {
    if (!currentUser) return;

    // Connect EventSource to SSE endpoint for real-time streaming notifications
    const eventSource = new EventSource(`/api/notifications/sse?userId=${currentUser.id}`);

    eventSource.addEventListener('initial', (e: MessageEvent) => {
      try {
        const initialData = JSON.parse(e.data);
        if (Array.isArray(initialData)) {
          setNotifications(initialData);
        }
      } catch (err) {
        console.error('Error parsing initial SSE notifications:', err);
      }
    });

    eventSource.addEventListener('new_notification', (e: MessageEvent) => {
      try {
        const newNotif = JSON.parse(e.data);
        if (newNotif && newNotif.id) {
          setNotifications(prev => [newNotif, ...prev]);
        }
      } catch (err) {
        console.error('Error parsing new SSE notification:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('SSE notification connection error, reconnecting...', err);
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser]);

  const markAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, markAll: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationClick = async (n: UserNotification) => {
    // 1. Mark notification as read
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId: n.id })
      });
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }

    // 2. Fetch order details for n.orderId
    try {
      const res = await fetch(`/api/orders/${n.orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrderForModal(data.order);
        setIsDetailModalOpen(true);
        setNotifDropdownOpen(false);
      } else {
        showToast(data.message || t('notifOrderGone'), 'info');
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      showToast(t('notifFetchError'), 'error');
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const pendingCount = users.filter(u => u.status === 'Pending').length;
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Overlay for Mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 z-50 flex flex-col justify-between transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-5 space-y-6">
          {/* Brand Logo & App Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base tracking-tight leading-tight">Miniapp Support</h1>
                <p className="text-[11px] text-slate-400">Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              {t('mainMenu')}
            </div>

            {/* 1. Overview */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {t('overviewTab')}
            </button>

            {/* 2. Phone & Roles */}
            <button
              onClick={() => {
                setActiveTab('phone-roles');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${activeTab === 'phone-roles'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
            >
              <Phone className="w-4 h-4 text-indigo-400" />
              {t('phoneRolesTab')}
            </button>

            {/* 3. SSO Registry */}
            <button
              onClick={() => {
                setActiveTab('sso-registry');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${activeTab === 'sso-registry'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t('ssoRegistryTab')}
            </button>

            {/* 4. Orders */}
            <button
              onClick={() => {
                setActiveTab('orders');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
            >
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              {t('ordersTab')}
            </button>

            {/* 5. MEMBER MANAGEMENT (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab('members');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${activeTab === 'members'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
              >
                <Users className="w-4 h-4 text-blue-400" />
                {t('memberManagementTab')}
              </button>
            )}

            {/* 6. USER APPROVAL MENU (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab('approval');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${activeTab === 'approval'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  {t('userApprovalTab')}
                </div>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 rounded-full animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* 7. System Settings (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
              >
                <Settings className="w-4 h-4" />
                {t('settingsTab')}
              </button>
            )}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
              />
              <div className="overflow-hidden">
                <div className="font-semibold text-white text-xs truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 overflow-hidden">
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[160px] sm:max-w-none">
                {activeTab === 'overview' && t('overviewTab')}
                {activeTab === 'approval' && t('userApprovalTab')}
                {activeTab === 'phone-roles' && t('phoneRolesTab')}
                {activeTab === 'orders' && t('ordersTab')}
                {activeTab === 'sso-registry' && t('ssoRegistryTab')}
                {activeTab === 'members' && t('memberManagementTab')}
                {activeTab === 'profile' && t('profileTab')}
                {activeTab === 'settings' && t('settingsTab')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notification Icon & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  if (userDropdownOpen) setUserDropdownOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700/60 rounded-xl relative transition cursor-pointer"
                title={t('notifBellTooltip')}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="min-w-4 h-4 px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full absolute -top-1 -right-1 flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover Menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3 z-50 text-xs space-y-2">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-indigo-400" />
                      {t('notifPanelTitle')} ({notifications.length})
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        {t('notifMarkAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 px-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        {t('notifEmpty')}
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 rounded-xl transition cursor-pointer hover:bg-slate-800/90 group ${n.read ? 'bg-slate-900/40 opacity-75' : 'bg-slate-800/60 border-l-2 border-indigo-500'}`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-white text-xs group-hover:text-indigo-300 transition">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.createdAt}</span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">{n.message}</p>
                          <div className="flex items-center justify-end">
                            <span className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {t('notifViewDetail')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown (User Profile & Log Out only) */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover bg-slate-700"
                />
                <span className="text-xs font-semibold text-white hidden md:inline">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  onClick={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs space-y-1"
                >
                  <div className="px-3.5 py-2 border-b border-slate-800 space-y-0.5">
                    <p className="font-bold text-white text-xs truncate">{currentUser.name}</p>
                    <p className="text-slate-400 text-[10px] truncate">{currentUser.email}</p>
                  </div>

                  {/* User Profile Option */}
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 text-slate-200 font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    {t('profileTab')}
                  </button>

                  {/* Log Out Option */}
                  <div className="border-t border-slate-800 pt-1">
                    <button
                      onClick={logout}
                      className="w-full text-left px-3.5 py-2.5 text-rose-400 hover:bg-rose-500/10 font-semibold flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <UserOverview
              onNavigateToPhoneRoles={() => setActiveTab('phone-roles')}
              onNavigateToSSORegistry={() => setActiveTab('sso-registry')}
            />
          )}
          {activeTab === 'approval' && (isAdmin ? <UserApproval /> : <UserOverview onNavigateToPhoneRoles={() => setActiveTab('phone-roles')} onNavigateToSSORegistry={() => setActiveTab('sso-registry')} />)}
          {activeTab === 'phone-roles' && (
            <PhoneRolesForm onNavigateToOrders={() => setActiveTab('orders')} />
          )}
          {activeTab === 'orders' && (
            <OrdersManagement onNavigateToCreate={() => setActiveTab('phone-roles')} />
          )}
          {activeTab === 'sso-registry' && <SSORegistry />}
          {activeTab === 'members' && (isAdmin ? <MemberManagement /> : <UserOverview onNavigateToPhoneRoles={() => setActiveTab('phone-roles')} onNavigateToSSORegistry={() => setActiveTab('sso-registry')} />)}
          {activeTab === 'profile' && (
            <UserOverview
              onNavigateToPhoneRoles={() => setActiveTab('phone-roles')}
              onNavigateToSSORegistry={() => setActiveTab('sso-registry')}
            />
          )}
          {activeTab === 'settings' && (isAdmin ? <SystemSettings /> : <UserOverview onNavigateToPhoneRoles={() => setActiveTab('phone-roles')} onNavigateToSSORegistry={() => setActiveTab('sso-registry')} />)}
        </main>
      </div>

      {/* Order Detail Modal Popup */}
      <OrderDetailModal
        order={selectedOrderForModal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
