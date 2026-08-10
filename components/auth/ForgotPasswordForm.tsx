'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { evaluatePasswordStrength, isPasswordStrong } from '@/lib/password-utils';
import { Mail, Lock, KeyRound, Check, X, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSwitchMode: (mode: 'login') => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSwitchMode }) => {
  const { forgotPassword } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordEval = evaluatePasswordStrength(newPassword);
  const passwordIsStrong = isPasswordStrong(newPassword);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError(t('emailLabel'));
      return;
    }
    setStep(2);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (resetCode.trim() !== '123456' && resetCode.trim().length < 4) {
      setError('Invalid verification code! (Demo hint: 123456)');
      return;
    }

    if (!passwordIsStrong) {
      setError(t('passNotStrongError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passNotMatchError'));
      return;
    }

    try {
      const res = await forgotPassword(email, newPassword);
      if (res.success) {
        setSuccessMessage(t('resetSuccessMsg'));
        setStep(3);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Error connecting to Backend!');
    }
  };

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
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('forgotTitle')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('forgotSub')}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('enterEmailLabel')}
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
                placeholder="user@system.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 transition duration-200 cursor-pointer"
          >
            {t('sendCodeBtn')}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
            💡 {t('demoCodeNotice')} <b>{email}</b>. {t('demoCodeHint')} <b>123456</b>)
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('enterCodeLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="123456"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('newPasswordLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
              />
            </div>

            {/* Password strength */}
            {newPassword.length > 0 && (
              <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-[11px] space-y-1">
                <div className={`flex items-center gap-1 ${passwordEval.minLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {passwordEval.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {t('ruleMinLength')}
                </div>
                <div className={`flex items-center gap-1 ${passwordEval.hasUpper && passwordEval.hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {passwordEval.hasUpper && passwordEval.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {t('ruleUpper')} & {t('ruleLower')}
                </div>
                <div className={`flex items-center gap-1 ${passwordEval.hasNumber && passwordEval.hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {passwordEval.hasNumber && passwordEval.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {t('ruleNumber')} & {t('ruleSpecial')}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('reEnterPasswordLabel')}
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
            disabled={!passwordIsStrong}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {t('resetAndLoginBtn')}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{successMessage}</p>
          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md cursor-pointer"
          >
            {t('backToLogin')}
          </button>
        </div>
      )}

      {step !== 3 && (
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            {t('alreadyHaveAccount')} {t('backToLogin')}
          </button>
        </div>
      )}
    </div>
  );
};
