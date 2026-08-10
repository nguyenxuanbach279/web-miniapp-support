'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { Sparkles, Clock, ShieldCheck, UserCheck, Phone, ArrowRight, ShieldAlert } from 'lucide-react';

interface UserOverviewProps {
  onNavigateToPhoneRoles?: () => void;
  onNavigateToSSORegistry?: () => void;
}

export const UserOverview: React.FC<UserOverviewProps> = ({
  onNavigateToPhoneRoles,
  onNavigateToSSORegistry
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-slate-900 border border-indigo-500/30 rounded-3xl shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl border-2 border-indigo-400/40 object-cover shadow-lg bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">{t('welcomeGreeting')} {currentUser.name}!</h2>
                <span className="p-1 text-amber-400">
                  <Sparkles className="w-5 h-5 animate-bounce" />
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('adminRoleBadge')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-full">
                    <UserCheck className="w-3.5 h-3.5" /> {t('userRoleBadge')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  {t('statusBadge')} {currentUser.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 backdrop-blur-xs border border-indigo-500/20 rounded-2xl text-xs space-y-1 self-stretch sm:self-auto">
            <div className="text-slate-400">{t('lastLogin')}</div>
            <div className="font-mono text-indigo-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {currentUser.lastLogin || t('justNow')}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section Header */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
          Hệ thống Tính năng & Dịch vụ (System Feature Portals)
        </h3>

        {/* Feature Block Card 1: Phone & Roles */}
        <div
          onClick={onNavigateToPhoneRoles}
          className="group p-6 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl transition duration-300 shadow-xl cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl transition duration-300 shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                  1. {t('phoneRolesFeatureTitle')}
                </h4>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                {t('phoneRolesFeatureDesc')}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 group-hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            {t('openFeatureBtn')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Block Card 2: SSO Registry */}
        <div
          onClick={onNavigateToSSORegistry}
          className="group p-6 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl transition duration-300 shadow-xl cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white rounded-2xl transition duration-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                  2. {t('ssoFeatureTitle')}
                </h4>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                {t('ssoFeatureDesc')}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-4 py-2 bg-emerald-600 group-hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            {t('openFeatureBtn')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
