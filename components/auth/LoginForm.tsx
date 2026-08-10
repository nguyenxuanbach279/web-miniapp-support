'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { AuthMode } from '@/lib/types';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSwitchMode: (mode: AuthMode) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchMode }) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        if (res.code === 'LOCKED' || res.message?.toLowerCase().includes('khóa')) {
          showToast('toastAccountLocked', 'error');
          setError('Bạn đã bị khóa tài khoản hãy liên hệ admin');
        } else if (res.code === 'PENDING' || res.message?.toLowerCase().includes('chờ admin')) {
          onSwitchMode('pending-approval');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError('Error connecting to Backend!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('loginTitle')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('loginSub')}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('emailLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('passwordLabel')}
            </label>
            <button
              type="button"
              onClick={() => onSwitchMode('forgot-password')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t('forgotPasswordLink')}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? t('signingInBtn') : (
            <>
              {t('signInBtn')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        {t('noAccountText')}{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('register')}
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
        >
          {t('signUpNow')}
        </button>
      </div>
    </div>
  );
};
