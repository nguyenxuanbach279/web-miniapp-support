'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { User, UserStatus } from '@/lib/types';
import {
  UserCheck,
  UserX,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Mail,
  Shield,
  AlertCircle,
  Layers,
  Check
} from 'lucide-react';

export const UserApproval: React.FC = () => {
  const { currentUser, users, refreshUsers } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | UserStatus>('Pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t('accessDeniedTitle')}</h3>
        <p className="text-sm text-slate-400 max-w-md">{t('accessDeniedSub')}</p>
      </div>
    );
  }

  // Count statistics
  const pendingCount = users.filter(u => u.status === 'Pending').length;
  const activeCount = users.filter(u => u.status === 'Active').length;
  const inactiveCount = users.filter(u => u.status === 'InActive').length;

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('toastAccountApproved', 'success');
        await refreshUsers();
      } else {
        showToast(data.message || 'Lỗi khi duyệt', 'error');
      }
    } catch (err) {
      console.error('Error approving user:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'InActive' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('toastAccountRejected', 'info');
        await refreshUsers();
      } else {
        showToast(data.message || 'Lỗi khi từ chối', 'error');
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAllPending = async () => {
    const pendingUsers = users.filter(u => u.status === 'Pending');
    if (pendingUsers.length === 0) return;

    for (const u of pendingUsers) {
      await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' })
      });
    }
    showToast('toastAccountApproved', 'success');
    await refreshUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            {t('userApprovalTitle')}
          </h3>
          <p className="text-xs text-slate-400">{t('userApprovalSub')}</p>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={handleApproveAllPending}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {t('approveAllPendingBtn')} ({pendingCount})
          </button>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">{t('pendingUsersCard')}</span>
              <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
            </div>
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active Card */}
        <div
          onClick={() => setStatusFilter('Active')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'Active'
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">{t('activeMembersCard')}</span>
              <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
            </div>
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* InActive Card */}
        <div
          onClick={() => setStatusFilter('InActive')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'InActive'
              ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">{t('inactiveMembersCard')}</span>
              <div className="text-2xl font-black text-rose-400">{inactiveCount}</div>
            </div>
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'Pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t('pendingUsersCard')}
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
              statusFilter === 'Pending' ? 'bg-amber-950/40 text-amber-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'All'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t('filterAll')}
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
              statusFilter === 'All' ? 'bg-indigo-500/40 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'Active'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('activeMembersCard')}
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
              statusFilter === 'Active' ? 'bg-emerald-500/40 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('InActive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'InActive'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            {t('inactiveMembersCard')}
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
              statusFilter === 'InActive' ? 'bg-rose-500/40 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Users Approval Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">{t('colMember')}</th>
                <th className="py-3.5 px-4">{t('colRole')}</th>
                <th className="py-3.5 px-4">{t('colStatus')}</th>
                <th className="py-3.5 px-4">{t('colCreatedLast')}</th>
                <th className="py-3.5 px-4 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    {t('noMembersFound')}
                  </td>
                </tr>
              ) : (
                  filteredUsers.map((user) => {
                    const isSelf = currentUser.id === user.id;
                    const isSuperAdminUser = user.email.toLowerCase() === 'nguyenxuanbach270901@gmail.com';

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition">
                        {/* User Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
                            />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                {user.name}
                                {isSuperAdminUser && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md font-bold">
                                    Super Admin
                                  </span>
                                )}
                                {isSelf && !isSuperAdminUser && (
                                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded-md font-normal">
                                    {t('youBadge')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border uppercase ${
                            user.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            user.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                              : user.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {user.status === 'Pending' ? 'Chờ duyệt' : user.status}
                          </span>
                        </td>

                        {/* Created / Last Login */}
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          <div>{user.createdAt}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.status !== 'Active' && (
                              <button
                                disabled={processingId === user.id}
                                onClick={() => handleApprove(user.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t('approveUserBtn')}
                              </button>
                            )}

                            {user.status !== 'InActive' && !isSelf && !isSuperAdminUser && (
                              <button
                                disabled={processingId === user.id}
                                onClick={() => handleReject(user.id)}
                                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                {t('rejectUserBtn')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
