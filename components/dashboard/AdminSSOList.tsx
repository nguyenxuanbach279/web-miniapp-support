'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { SSOItem } from '@/lib/types';
import { ShieldCheck, Search, Eye, EyeOff, Copy, ShieldAlert } from 'lucide-react';

interface AdminSSOListProps {
  onNavigateToRegister?: () => void;
}

export const AdminSSOList: React.FC<AdminSSOListProps> = ({ onNavigateToRegister }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [ssoItems, setSsoItems] = useState<SSOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Visibility map for Client Secret
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const fetchSSOItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sso');
      const data = await res.json();
      if (data.success && Array.isArray(data.ssoItems)) {
        setSsoItems(data.ssoItems);
      }
    } catch (err) {
      console.error('Error fetching SSO items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSSOItems();
  }, []);

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('toastCopied', 'info');
  };

  const filteredItems = ssoItems.filter(item => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      item.clientId.toLowerCase().includes(term) ||
      item.appId.toLowerCase().includes(term) ||
      item.appName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            {t('adminSSOListTitle')}
          </h3>
          <p className="text-xs text-slate-400">{t('adminSSOListSub')}</p>
        </div>
      </div>

      {/* Toolbar & Search across Client ID, MiniApp ID, MiniApp Name */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Client ID, MiniApp ID, MiniApp Name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* SSO Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">{t('colClientId')}</th>
                <th className="py-3.5 px-4">{t('colAppId')}</th>
                <th className="py-3.5 px-4">{t('colAppName')}</th>
                <th className="py-3.5 px-4">{t('colInternalId')}</th>
                <th className="py-3.5 px-4">{t('colClientSecret')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    Loading SSO Items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    {t('noSSOFound')}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isVisible = !!visibleSecrets[item.id];

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      {/* Client ID */}
                      <td className="py-3.5 px-4 font-mono text-xs text-indigo-300 font-semibold">
                        {item.clientId}
                      </td>

                      {/* MiniApp ID */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {item.appId}
                      </td>

                      {/* MiniApp Name with Truncation (...) */}
                      <td className="py-3.5 px-4 text-xs font-medium text-white max-w-[220px]">
                        <span
                          title={item.appName}
                          className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg truncate block max-w-full"
                        >
                          {item.appName}
                        </span>
                      </td>

                      {/* Internal ID */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        {item.internalId}
                      </td>

                      {/* Client Secret with Tooltip when visible */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2 relative">
                          <div className="relative group/secret">
                            <span
                              title={isVisible ? t('secretWarningTooltip') : t('showSecretBtn')}
                              className={`font-semibold font-mono tracking-wider inline-block w-[150px] shrink-0 truncate ${
                                isVisible ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {isVisible ? item.clientSecret : '••••••••••••••••'}
                            </span>

                            {/* Tooltip on Reveal */}
                            {isVisible && (
                              <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-slate-950 border border-amber-500/40 text-amber-300 text-[11px] font-sans rounded-xl shadow-2xl z-30 whitespace-nowrap pointer-events-none flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                                <span>{t('secretWarningTooltip')}</span>
                                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-950" />
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility(item.id)}
                            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                            title={isVisible ? t('hideSecretBtn') : t('showSecretBtn')}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.clientSecret)}
                            className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                            title={t('copyBtn')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
