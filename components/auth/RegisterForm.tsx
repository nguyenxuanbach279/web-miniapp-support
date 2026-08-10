'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { evaluatePasswordStrength, isPasswordStrong } from '@/lib/password-utils';
import { Role, AuthMode } from '@/lib/types';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Check, X, Shield, AlertCircle, ArrowLeft } from 'lucide-react';

interface RegisterFormProps {
  onSwitchMode: (mode: AuthMode) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchMode }) => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('user');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordEval = evaluatePasswordStrength(password);
  const passwordIsStrong = isPasswordStrong(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordIsStrong) {
      setError(t('passNotStrongError'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passNotMatchError'));
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password, role);
      if (res.success) {
        onSwitchMode('pending-approval');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Error connecting to Backend!');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return { text: t('strengthWeak'), color: 'bg-rose-500', textClass: 'text-rose-500' };
    if (score <= 3) return { text: t('strengthMedium'), color: 'bg-amber-500', textClass: 'text-amber-500' };
    return { text: t('strengthStrong'), color: 'bg-emerald-500', textClass: 'text-emerald-500' };
  };

  const strengthInfo = getStrengthLabel(passwordEval.score);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('registerTitle')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('registerSub')}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('fullNameLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              placeholder="email@example.com"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('strongPasswordLabel')}
          </label>
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
              className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="mt-2 space-y-2 p-2.5 bg-slate-100/70 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-400">{t('passwordStrength')}</span>
                <span className={`font-semibold ${strengthInfo.textClass}`}>
                  {strengthInfo.text}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${passwordEval.score >= 1 ? strengthInfo.color : 'bg-transparent'} transition-all`} />
                <div className={`h-full ${passwordEval.score >= 2 ? strengthInfo.color : 'bg-transparent'} transition-all`} />
                <div className={`h-full ${passwordEval.score >= 3 ? strengthInfo.color : 'bg-transparent'} transition-all`} />
                <div className={`h-full ${passwordEval.score >= 4 ? strengthInfo.color : 'bg-transparent'} transition-all`} />
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1">
                <div className={`flex items-center gap-1 ${passwordEval.minLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  {passwordEval.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {t('ruleMinLength')}
                </div>
                <div className={`flex items-center gap-1 ${passwordEval.hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  {passwordEval.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {t('ruleUpper')}
                </div>
                <div className={`flex items-center gap-1 ${passwordEval.hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  {passwordEval.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {t('ruleLower')}
                </div>
                <div className={`flex items-center gap-1 ${passwordEval.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  {passwordEval.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {t('ruleNumber')}
                </div>
                <div className={`col-span-2 flex items-center gap-1 ${passwordEval.hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  {passwordEval.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {t('ruleSpecial')}
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('confirmPasswordLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !passwordIsStrong}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? t('creatingAccountBtn') : t('completeRegisterBtn')}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        {t('alreadyHaveAccount')}{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
        >
          {t('backToLogin')}
        </button>
      </div>
    </div>
  );
};
