'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { InstallLinkItem } from '@/lib/types';
import {
  Settings,
  FileJson,
  AlertCircle,
  Upload,
  Code,
  Link,
  Plus,
  Trash2,
  Edit2,
  Check,
  Smartphone,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'sso-json' | 'install-links'>('sso-json');

  // --- SSO JSON Importer state ---
  const [jsonText, setJsonText] = useState(`[
  {
    "clientId": "super-app-client",
    "appId": "1512079453994241503232",
    "appName": "Quản lý thiết bị POC",
    "internalId": "12312312321312312",
    "clientSecret": "12321321312312312"
  }
]`);
  const [importing, setImporting] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);

  // --- Install Links state ---
  const [installLinks, setInstallLinks] = useState<InstallLinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  
  // Add Link state
  const [newTitle, setNewTitle] = useState('');
  const [newUrlOrVersion, setNewUrlOrVersion] = useState('');
  const [addingLink, setAddingLink] = useState(false);

  // Edit Link state
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrlOrVersion, setEditUrlOrVersion] = useState('');
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);

  // Fetch install links
  const fetchInstallLinks = async () => {
    try {
      setLoadingLinks(true);
      const res = await fetch('/api/settings/install-links');
      const data = await res.json();
      if (data.success && Array.isArray(data.installLinks)) {
        setInstallLinks(data.installLinks);
      }
    } catch (err) {
      console.error('Error fetching install links:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'install-links') {
      fetchInstallLinks();
    }
  }, [activeSubTab]);

  const handleImportJSON = async (e: React.FormEvent) => {
    e.preventDefault();
    setSsoError(null);

    let parsedItems: any[] = [];
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setSsoError('Dữ liệu JSON nhập vào phải là một Mảng (JSON Array) [ ... ]');
        return;
      }
      parsedItems = parsed;
    } catch (err: any) {
      setSsoError(`Cú pháp JSON không hợp lệ: ${err.message}`);
      return;
    }

    if (parsedItems.length === 0) {
      setSsoError('Mảng JSON không chứa phần tử nào!');
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
        setSsoError(data.message || 'Lỗi khi import JSON');
      }
    } catch (err) {
      setSsoError('Lỗi kết nối Server!');
    } finally {
      setImporting(false);
    }
  };

  // Add Install Link
  const handleAddInstallLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrlOrVersion.trim()) {
      showToast('Vui lòng điền đủ Tên bản cài và Đường dẫn/Phiên bản', 'error');
      return;
    }

    setAddingLink(true);
    try {
      const res = await fetch('/api/settings/install-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          urlOrVersion: newUrlOrVersion.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewUrlOrVersion('');
        if (Array.isArray(data.installLinks)) {
          setInstallLinks(data.installLinks);
        } else {
          await fetchInstallLinks();
        }
        showToast(data.message || 'Đã thêm đường dẫn cài đặt!', 'success');
      } else {
        showToast(data.message || 'Lỗi khi thêm mới', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối Server!', 'error');
    } finally {
      setAddingLink(false);
    }
  };

  // Start Edit
  const handleStartEdit = (link: InstallLinkItem) => {
    setEditingLinkId(link.id);
    setEditTitle(link.title);
    setEditUrlOrVersion(link.urlOrVersion);
  };

  // Save Edit
  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editUrlOrVersion.trim()) {
      showToast('Tên và đường dẫn/phiên bản không được để trống', 'error');
      return;
    }

    setSavingLinkId(id);
    try {
      const res = await fetch('/api/settings/install-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: editTitle.trim(),
          urlOrVersion: editUrlOrVersion.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditingLinkId(null);
        if (Array.isArray(data.installLinks)) {
          setInstallLinks(data.installLinks);
        } else {
          await fetchInstallLinks();
        }
        showToast(data.message || 'Cập nhật thành công!', 'success');
      } else {
        showToast(data.message || 'Lỗi khi lưu', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối Server!', 'error');
    } finally {
      setSavingLinkId(null);
    }
  };

  // Delete Link
  const handleDeleteLink = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/install-links?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.installLinks)) {
          setInstallLinks(data.installLinks);
        } else {
          await fetchInstallLinks();
        }
        showToast(data.message || 'Đã xóa đường dẫn cài đặt!', 'success');
      } else {
        showToast(data.message || 'Lỗi khi xóa', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối Server!', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header & Sub-Tab Bar */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('systemSettingsTitle')}</h2>
              <p className="text-xs text-slate-400">{t('systemSettingsSub')}</p>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('sso-json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'sso-json'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              JSON SSO Register
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('install-links')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'install-links'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              {t('installLinksManageSubTab')}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-screen 1: JSON SSO Register */}
      {activeSubTab === 'sso-json' && (
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

          {ssoError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ssoError}</span>
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
      )}

      {/* Sub-screen 2: Install Links Management */}
      {activeSubTab === 'install-links' && (
        <div className="space-y-6">
          {/* Add New Link Block */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">{t('installLinksAddNewTitle')}</h3>
            </div>

            <form onSubmit={handleAddInstallLink} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-medium text-slate-400">{t('installLinkTitleLabel')}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t('installLinkTitlePlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-medium text-slate-400">{t('installLinkUrlLabel')}</label>
                <input
                  type="text"
                  required
                  value={newUrlOrVersion}
                  onChange={(e) => setNewUrlOrVersion(e.target.value)}
                  placeholder={t('installLinkUrlPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={addingLink}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {addingLink ? t('installLinkAddingBtn') : t('installLinkAddBtn')}
                </button>
              </div>
            </form>
          </div>

          {/* Current Links List */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">{t('installLinkCurrentListTitle')} ({installLinks.length})</h3>
              </div>
              <button
                type="button"
                onClick={fetchInstallLinks}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                title={t('installLinksRefreshBtn')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLinks ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingLinks ? (
              <div className="py-8 text-center text-slate-400 text-xs">{t('installLinksLoading')}</div>
            ) : installLinks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                {t('installLinksEmpty')}
              </div>
            ) : (
              <div className="space-y-3">
                {installLinks.map((link) => {
                  const isEditing = editingLinkId === link.id;

                  return (
                    <div
                      key={link.id}
                      className="p-4 bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition space-y-3"
                    >
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-indigo-500 rounded-xl text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={editUrlOrVersion}
                              onChange={(e) => setEditUrlOrVersion(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-indigo-500 rounded-xl text-xs text-emerald-400 font-mono"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(link.id)}
                              disabled={savingLinkId === link.id}
                              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                              title="Lưu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLinkId(null)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
                              title="Hủy"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1 overflow-hidden">
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{link.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({link.updatedAt})</span>
                            </div>
                            <div className="text-xs font-mono text-emerald-400 break-all bg-emerald-950/20 border border-emerald-500/20 px-3 py-1.5 rounded-xl inline-block">
                              {link.urlOrVersion}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(link)}
                              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition cursor-pointer"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLink(link.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
