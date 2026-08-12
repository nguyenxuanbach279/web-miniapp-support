'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast-context';
import { useLanguage } from '@/lib/language-context';
import { InstallLinkItem } from '@/lib/types';
import { Smartphone, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';

interface InstallLinksViewProps {
  compact?: boolean;
}

export const InstallLinksView: React.FC<InstallLinksViewProps> = ({ compact = false }) => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [links, setLinks] = useState<InstallLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/install-links');
      const data = await res.json();
      if (data.success && Array.isArray(data.installLinks)) {
        setLinks(data.installLinks);
      }
    } catch (err) {
      console.error('Error fetching install links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopy = async (id: string, text: string, title: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(t('toastCopied'), 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      showToast(t('toastCopied'), 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl p-6 ${compact ? 'space-y-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('installLinksTitle')}</h3>
            <p className="text-xs text-slate-400">{t('installLinksSub')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLinks}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title={t('installLinksRefreshBtn')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('installLinksRefreshBtn')}</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs">{t('installLinksLoading')}</div>
      ) : links.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          {t('installLinksEmpty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((item) => {
            const isCopied = copiedId === item.id;
            const isUrl = item.urlOrVersion.startsWith('http://') || item.urlOrVersion.startsWith('https://');

            return (
              <div
                key={item.id}
                className="p-4 bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl transition duration-200 flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{item.updatedAt}</span>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 break-all leading-relaxed flex items-start gap-2">
                    {isUrl && <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />}
                    <span>{item.urlOrVersion}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
                  <span className="text-[11px] text-slate-500">
                    {isUrl ? t('installLinksUrlType') : t('installLinksVersionType')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.urlOrVersion, item.title)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200 animate-bounce" />
                        {t('installLinksCopiedBtn')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        {t('installLinksCopyBtn')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
