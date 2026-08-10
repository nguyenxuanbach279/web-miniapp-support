'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { SSOItem } from '@/lib/types';
import { ShieldCheck, Layers, Send, Eye, Search, Check, Copy, Info, AlertCircle } from 'lucide-react';

interface FormSSORegistrationProps {
  onNavigateToList?: () => void;
}

export const FormSSORegistration: React.FC<FormSSORegistrationProps> = ({ onNavigateToList }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [clientId, setClientId] = useState('');
  const [appId, setAppId] = useState('');
  const [baseAppName, setBaseAppName] = useState('');
  const [environment, setEnvironment] = useState<'poc' | 'prod'>('poc');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search MiniApp ID -> Return Client ID state
  const [searchAppId, setSearchAppId] = useState('');
  const [allSSOItems, setAllSSOItems] = useState<SSOItem[]>([]);
  const [searchResult, setSearchResult] = useState<SSOItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetch('/api/sso')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.ssoItems)) {
          setAllSSOItems(data.ssoItems);
        }
      })
      .catch(err => console.error('Error fetching SSO list for search:', err));
  }, []);

  const handleSearchAppId = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchAppId.trim();
    if (!term) {
      setSearchResult(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const match = allSSOItems.find(item => item.appId.toLowerCase() === term.toLowerCase());
    setSearchResult(match || null);
  };

  const handleAutofillClientId = (foundClientId: string, foundAppId?: string, foundAppName?: string) => {
    setClientId(foundClientId);
    if (foundAppId) setAppId(foundAppId);
    if (foundAppName) {
      // If appName has trailing poc or prod, extract base
      const clean = foundAppName.replace(/\s+(poc|prod)$/i, '');
      setBaseAppName(clean);
    }
    showToast('toastCopied', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId.trim() || !appId.trim() || !baseAppName.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (Client ID, MiniApp ID, MiniApp Name)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          appId,
          appName: baseAppName,
          environment,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userName: currentUser?.name
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('toastSSORegistered', 'success');
        setClientId('');
        setAppId('');
        setBaseAppName('');
        setEnvironment('poc');

        if (onNavigateToList) {
          onNavigateToList();
        }
      } else {
        setError(data.message || 'Lỗi khi đăng ký SSO');
      }
    } catch (err) {
      setError('Lỗi kết nối Server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('ssoRegisterTitle')}</h2>
        </div>
        <p className="text-xs text-slate-400 pl-10">{t('ssoRegisterSub')}</p>
      </div>

      {/* Tool: Search MiniApp ID -> Return Client ID */}
      <div className="p-5 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl space-y-4 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" />
            {t('searchAppIdTitle')}
          </h3>
          <p className="text-xs text-slate-400">{t('searchAppIdSub')}</p>
        </div>

        <form onSubmit={handleSearchAppId} className="flex gap-2">
          <input
            type="text"
            value={searchAppId}
            onChange={(e) => {
              setSearchAppId(e.target.value);
              if (!e.target.value) {
                setHasSearched(false);
                setSearchResult(null);
              }
            }}
            placeholder={t('searchAppIdPlaceholder')}
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </form>

        {/* Search Results Display Box */}
        {hasSearched && (
          <div className="mt-3">
            {searchResult ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">{t('foundClientIdLabel')}</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{searchResult.clientId}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">App Name: {searchResult.appName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAutofillClientId(searchResult.clientId, searchResult.appId, searchResult.appName)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t('useAndAutofillBtn')}
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t('noAppIdMatch')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-6">
        {error && (
          <div className="p-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {t('clientIdLabel')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder={t('clientIdPlaceholder')}
              className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition font-mono"
            />
          </div>

          {/* MiniApp ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {t('appIdLabel')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder={t('appIdPlaceholder')}
              className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition font-mono"
            />
          </div>

          {/* MiniApp Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {t('appNameLabel')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={baseAppName}
              onChange={(e) => setBaseAppName(e.target.value)}
              placeholder={t('appNamePlaceholder')}
              className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
            />
          </div>

          {/* Environment Selector (POC / PROD) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t('envLabel')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEnvironment('poc')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer uppercase ${
                  environment === 'poc'
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                {t('envPocOption')} (POC)
              </button>

              <button
                type="button"
                onClick={() => setEnvironment('prod')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer uppercase ${
                  environment === 'prod'
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                {t('envProdOption')} (PROD)
              </button>
            </div>

            {/* Helper Text explaining environment selection */}
            <p className="text-[11px] text-slate-400 italic flex items-center gap-1 mt-1">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {t('envHelperText')}
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || !clientId.trim() || !appId.trim() || !baseAppName.trim()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              t('registeringSSOBtn')
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t('registerSSOBtn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
