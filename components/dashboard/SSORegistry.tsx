'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { FormSSORegistration } from './FormSSORegistration';
import { AdminSSOList } from './AdminSSOList';
import { GuideModal } from './GuideModal';
import { ShieldCheck, PlusCircle, ListFilter, HelpCircle } from 'lucide-react';

export const SSORegistry: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState<'register' | 'list'>('register');
  const [showGuide, setShowGuide] = useState(false);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    const hideGuide = localStorage.getItem('hide_sso_guide');
    if (hideGuide !== 'true') {
      setShowGuide(true);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Guide Modal Popup */}
      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        titleKey="ssoGuideTitle"
        contentKey="ssoGuideContent"
        storageKey="hide_sso_guide"
      />

      {/* Sub-tab Navigation Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{t('ssoRegistryTitle')}</h2>
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 transition cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                {t('openGuideBtn')}
              </button>
            </div>
            <p className="text-xs text-slate-400">{t('ssoRegistrySub')}</p>
          </div>
        </div>

        {/* Sub-tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl w-full sm:w-auto">
          {/* Sub-tab 1: SSO Registration */}
          <button
            onClick={() => setSubTab('register')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {t('ssoSubTabRegister')}
          </button>

          {/* Sub-tab 2: Admin SSO List — only for super_admin */}
          {isSuperAdmin && (
            <button
              onClick={() => setSubTab('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                subTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              {t('ssoSubTabAdminList')}
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Content Rendering */}
      {subTab === 'register' && (
        <FormSSORegistration onNavigateToList={() => isSuperAdmin ? setSubTab('list') : undefined} />
      )}

      {subTab === 'list' && isSuperAdmin && (
        <AdminSSOList onNavigateToRegister={() => setSubTab('register')} />
      )}
    </div>
  );
};
