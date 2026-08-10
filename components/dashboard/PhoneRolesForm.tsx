'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { PhoneRole } from '@/lib/types';
import { extractPhoneNumbers } from '@/lib/phone-utils';
import { GuideModal } from './GuideModal';
import { Phone, Shield, CheckCircle2, AlertCircle, Send, ShoppingBag, HelpCircle } from 'lucide-react';

interface PhoneRolesFormProps {
  onNavigateToOrders?: () => void;
}

export const PhoneRolesForm: React.FC<PhoneRolesFormProps> = ({ onNavigateToOrders }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [rawText, setRawText] = useState('');
  const [phoneRole, setPhoneRole] = useState<PhoneRole>('full'); // Default value is 'full'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const detectedPhones = extractPhoneNumbers(rawText);

  useEffect(() => {
    const hideGuide = localStorage.getItem('hide_phone_guide');
    if (hideGuide !== 'true') {
      setShowGuide(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) return;

    if (detectedPhones.length === 0) {
      setError(t('noPhoneDetected'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          rawText,
          phoneRole
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('toastOrderCreated', 'success');
        setRawText('');
        setPhoneRole('full');
        if (onNavigateToOrders) {
          onNavigateToOrders();
        }
      } else {
        setError(data.message || 'Error creating order');
      }
    } catch (err) {
      setError('Error connecting to Server');
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions: PhoneRole[] = ['poc', 'prod', 'full', 'admin', 'default'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Guide Modal Popup */}
      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        titleKey="phoneGuideTitle"
        contentKey="phoneGuideContent"
        storageKey="hide_phone_guide"
      />

      {/* Title */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{t('phoneRolesTitle')}</h2>
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 transition cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                {t('openGuideBtn')}
              </button>
            </div>
          </div>

          {onNavigateToOrders && (
            <button
              type="button"
              onClick={onNavigateToOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {t('ordersTab')}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 pl-10">{t('phoneRolesSub')}</p>
      </div>

      {/* Form Container */}
      <div className="p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input text / sentence */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t('enterPhoneTextLabel')}
            </label>
            <textarea
              required
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={t('enterPhoneTextPlaceholder')}
              className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
            />

            {/* Realtime Phone Detector Box */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-slate-400 font-medium">
                {t('detectedPhoneLabel')} {detectedPhones.length > 1 && `(${detectedPhones.length} số)`}
              </span>
              {detectedPhones.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {detectedPhones.map((ph, idx) => (
                    <span key={idx} className="font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ph}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 italic">
                  {rawText.length > 0 ? t('noPhoneDetected') : 'VD: 0972390426 | 0382285315 | 0388460740'}
                </span>
              )}
            </div>
          </div>

          {/* Role selector option pills */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t('selectPhoneRoleLabel')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {roleOptions.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setPhoneRole(opt)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                    phoneRole === opt
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || detectedPhones.length === 0}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              t('submittingBtn')
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t('submitOrderBtn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
