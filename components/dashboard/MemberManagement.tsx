'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { User, Role, UserStatus } from '@/lib/types';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Filter,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Lock,
  X,
  Mail,
  Shield,
  User as UserIcon,
  Crown,
  AlertCircle
} from 'lucide-react';

export const MemberManagement: React.FC = () => {
  const { currentUser, users, toggleUserStatus, updateUserRole, addUser, deleteUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | UserStatus>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | Role>('All');

  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');
  const [addError, setAddError] = useState<string | null>(null);

  // Confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Access check
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

  // Filter logic
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalUsers = users.length;
  const activeUsersCount = users.filter(u => u.status === 'Active').length;
  const inactiveUsersCount = users.filter(u => u.status === 'InActive').length;
  const adminUsersCount = users.filter(u => u.role === 'admin').length;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    try {
      const res = await addUser({
        name: newName,
        email: newEmail,
        role: newRole,
        status: 'Active'
      });

      if (res.success) {
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewRole('user');
      } else {
        setAddError(res.message);
      }
    } catch (err) {
      setAddError('Error connecting to Backend!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar with Add User button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{t('memberManagementTitle')}</h3>
          <p className="text-xs text-slate-400">{t('memberManagementSub')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('addMemberBtn')}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">{t('totalMembersCard')}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalUsers}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">{t('activeMembersCard')}</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{activeUsersCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">{t('inactiveMembersCard')}</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{inactiveUsersCount}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">{t('adminUsersCard')}</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{adminUsersCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 border border-slate-700 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <span className="text-slate-400 font-medium">{t('statusFilterLabel')}</span>
            {(['All', 'Active', 'InActive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'All' ? t('filterAll') : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 border border-slate-700 rounded-xl text-xs">
            <span className="text-slate-400 font-medium ml-2">{t('roleFilterLabel')}</span>
            {(['All', 'admin', 'user'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'All' ? t('filterAll') : r === 'admin' ? 'Admin' : 'User'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
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
                  const isCurrent = currentUser?.id === user.id;
                  const isSuperAdminUser = user.email.toLowerCase() === 'nguyenxuanbach270901@gmail.com';

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      {/* Member profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border border-slate-700 object-cover bg-slate-800 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{user.name}</span>
                              {isSuperAdminUser && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-400" /> Super Admin
                                </span>
                              )}
                              {isCurrent && !isSuperAdminUser && (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-medium">
                                  {t('youBadge')}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role badge with instant role toggle for Admin/Super Admin */}
                      <td className="py-3.5 px-4">
                        {isSuperAdminUser ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl text-xs font-bold">
                            <Shield className="w-3.5 h-3.5" /> Admin (Super)
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const nextRole: Role = user.role === 'admin' ? 'user' : 'admin';
                              updateUserRole(user.id, nextRole);
                              showToast('toastRoleUpdated', 'success');
                            }}
                            title="Nhấp để chuyển đổi Vai trò (Role)"
                            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer hover:border-indigo-500"
                          >
                            {user.role === 'admin' ? (
                              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 border-amber-400/30 px-2 py-0.5 rounded-lg">
                                <Shield className="w-3.5 h-3.5" /> Admin
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 border-blue-400/30 px-2 py-0.5 rounded-lg">
                                <UserIcon className="w-3.5 h-3.5" /> User
                              </span>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Status Active/InActive */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              user.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            {user.status}
                          </span>

                          {!isSuperAdminUser && (
                            <button
                              onClick={() => {
                                toggleUserStatus(user.id);
                                showToast('toastStatusUpdated', 'success');
                              }}
                              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                              title="Thay đổi trạng thái"
                            >
                              {user.status === 'Active' ? (
                                <ToggleRight className="w-6 h-6 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-slate-500" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <div>{t('createdOn')} {user.createdAt}</div>
                        <div className="text-[11px] text-slate-500">{t('loginOn')} {user.lastLogin || t('neverLogin')}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isSuperAdminUser && (
                            <button
                              onClick={() => {
                                toggleUserStatus(user.id);
                                showToast('toastStatusUpdated', 'success');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                user.status === 'Active'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              }`}
                            >
                              {user.status === 'Active' ? t('lockUserBtn') : t('unlockUserBtn')}
                            </button>
                          )}

                          {!isCurrent && !isSuperAdminUser && (
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                              title="Xóa người dùng"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">{t('addMemberModalTitle')}</h3>

            {addError && (
              <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('fullNameLabel')}</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('emailLabel')}</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john.smith@company.com"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('roleFilterLabel')}</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="user">{t('userRoleOption')}</option>
                  <option value="admin">{t('adminRoleOption')}</option>
                </select>
              </div>

              {/* Default Password Notice */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
                <span>Mật khẩu khởi tạo mặc định:</span>
                <code className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-500/40 rounded-md font-mono text-xs text-amber-300 font-bold">
                  User@123456!
                </code>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  {t('createMemberBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">{t('confirmDeleteTitle')}</h4>
            <p className="text-xs text-slate-400 mt-1 mb-5">{t('confirmDeleteSub')}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                {t('cancelBtn')}
              </button>
              <button
                onClick={() => {
                  deleteUser(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                {t('deleteNowBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
