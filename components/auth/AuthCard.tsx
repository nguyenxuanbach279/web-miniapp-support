'use client';

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { PendingApprovalView } from './PendingApprovalView';
import { AuthMode } from '@/lib/types';
import { useLanguage } from '@/lib/language-context';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';

export const AuthCard: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-100 p-4 relative overflow-hidden">
      {/* Language Switcher at Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Dynamic Animated Background Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            {t('portalTitle')}
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
              v2.5
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t('portalSub')}</p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black/50 text-slate-900 dark:text-white transition-all duration-300">
          {mode === 'login' && <LoginForm onSwitchMode={(newMode) => setMode(newMode)} />}
          {mode === 'register' && <RegisterForm onSwitchMode={(newMode) => setMode(newMode)} />}
          {mode === 'forgot-password' && <ForgotPasswordForm onSwitchMode={() => setMode('login')} />}
          {mode === 'pending-approval' && <PendingApprovalView onSwitchMode={() => setMode('login')} />}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('securityNotice')}</span>
        </div>
      </div>
    </div>
  );
};
