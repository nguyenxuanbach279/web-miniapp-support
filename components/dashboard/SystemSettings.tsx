'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { Settings, FileJson, CheckCircle2, AlertCircle, Upload, Code } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [jsonText, setJsonText] = useState(`[
  {
    "clientId": "clientId",
    "appId": "appId",
    "appName": "appName",
    "internalId": "internalId",
    "clientSecret": "clientSecret"
  }
]`);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImportJSON = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedItems: any[] = [];
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setError('Dữ liệu JSON nhập vào phải là một Mảng (JSON Array) [ ... ]');
        return;
      }
      parsedItems = parsed;
    } catch (err: any) {
      setError(`Cú pháp JSON không hợp lệ: ${err.message}`);
      return;
    }

    if (parsedItems.length === 0) {
      setError('Mảng JSON không chứa phần tử nào!');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'import',
          items: parsedItems
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('toastSSOImported', 'success');
      } else {
        setError(data.message || 'Lỗi khi import JSON');
      }
    } catch (err) {
      setError('Lỗi kết nối Server!');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('systemSettingsTitle')}</h2>
        </div>
        <p className="text-xs text-slate-400 pl-10">{t('systemSettingsSub')}</p>
      </div>

      {/* SSO Registry JSON Importer Box */}
      <div className="p-6 sm:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-2xl">
            <FileJson className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t('ssoJSONImportTitle')}</h3>
            <p className="text-xs text-slate-400">{t('ssoJSONImportSub')}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleImportJSON} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                {t('jsonInputLabel')}
              </label>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                JSON Array Format
              </span>
            </div>

            <textarea
              required
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={t('jsonInputPlaceholder')}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-400 placeholder-slate-600 focus:outline-hidden focus:border-indigo-500 transition leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 italic">
              * {t('jsonFormatHelp')}
            </p>
          </div>

          <button
            type="submit"
            disabled={importing || !jsonText.trim()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {importing ? (
              t('importingJSONBtn')
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t('saveImportJSONBtn')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
