'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';
import { Clock, ShieldAlert, ArrowLeft, Mail, PhoneCall } from 'lucide-react';

interface PendingApprovalViewProps {
  onSwitchMode: (mode: 'login') => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({ onSwitchMode }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 text-center">
      {/* Icon header with animated glow */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-amber-500/40">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Main title */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {t('pendingNoticeTitle')}
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          {t('pendingNoticeSub')}
        </p>
      </div>

      {/* Contact Admin Callout Box */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-2">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{t('contactAdminMsg')}</span>
        </div>
        <p className="text-[11px] text-slate-300">
          Vui lòng trao đổi trực tiếp với Quản trị viên (Admin) của hệ thống để tài khoản của bạn được phê duyệt vào sử dụng.
        </p>
      </div>

      {/* Action button */}
      <button
        type="button"
        onClick={() => onSwitchMode('login')}
        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToLogin')}
      </button>
    </div>
  );
};
