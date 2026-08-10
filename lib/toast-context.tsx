'use client';

import React, { createContext, useContext, useState } from 'react';
import { useLanguage } from './language-context';
import { translations } from './translations';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  messageKey?: keyof typeof translations.en;
  customMessage?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: keyof typeof translations.en | string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: keyof typeof translations.en | string, type: ToastType = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isTranslationKey = Object.keys(translations.en).includes(message);

    const newToast: ToastItem = {
      id,
      messageKey: isTranslationKey ? (message as keyof typeof translations.en) : undefined,
      customMessage: isTranslationKey ? undefined : message,
      type
    };

    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container Floating Top-Right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          const text = toast.messageKey ? t(toast.messageKey) : toast.customMessage || '';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 transition-all duration-300 animate-in slide-in-from-right-10 ${
                toast.type === 'success'
                  ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40'
                  : toast.type === 'error'
                  ? 'bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-rose-950/40'
                  : 'bg-slate-900/95 border-indigo-500/40 text-indigo-300 shadow-indigo-950/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
                <p className="text-xs font-semibold leading-snug">{text}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
