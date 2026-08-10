'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { Order, PhoneRole, OrderStatus } from '@/lib/types';
import { ShoppingBag, Search, Plus, Edit2, Trash2, Shield, Phone, ShieldCheck, Layers, AlertCircle, X, Check, Clock, FileJson, Download, CheckCircle2 } from 'lucide-react';

interface OrdersManagementProps {
  onNavigateToCreate?: () => void;
}

export const OrdersManagement: React.FC<OrdersManagementProps> = ({ onNavigateToCreate }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'phone&role' | 'sso'>('all');
  const [copied, setCopied] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);

  // Edit modal state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editRawText, setEditRawText] = useState('');
  const [editRole, setEditRole] = useState<PhoneRole>('full');
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?userId=${currentUser.id}&role=${currentUser.role}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setEditRawText(order.rawText);
    setEditRole(order.phoneRole);
    setEditStatus(order.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: editRawText,
          phoneRole: editRole,
          status: editStatus
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditingOrder(null);
        showToast('toastOrderUpdated', 'success');
        await fetchOrders();
      }
    } catch (err) {
      console.error('Error updating order:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;

    setCompleting(true);
    try {
      const res = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrderIds })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Đã hoàn thành các order được chọn và gửi thông báo!', 'success');
        setSelectedOrderIds([]);
        await fetchOrders();
      } else {
        showToast(data.message || 'Lỗi khi hoàn thành order', 'error');
      }
    } catch (err) {
      console.error('Error completing orders:', err);
      showToast('Lỗi kết nối server', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmId(null);
        setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
        showToast('toastOrderDeleted', 'success');
        await fetchOrders();
      }
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const getSSOExportFields = (o: Order) => {
    let appName = o.appName || '';
    let appId = o.appId || '';
    let clientId = o.clientId || '';

    if (!appName || !appId || !clientId) {
      const match = o.rawText.match(/Đăng ký SSO:\s*(.*?)\s*\(MiniApp ID:\s*(.*?), Client ID:\s*(.*?)\)/i);
      if (match) {
        if (!appName) appName = match[1];
        if (!appId) appId = match[2];
        if (!clientId) clientId = match[3];
      }
    }

    return { appName, appId, clientId };
  };

  const handleExportJSON = async () => {
    const targetOrders = selectedOrderIds.length > 0
      ? orders.filter(o => selectedOrderIds.includes(o.id))
      : orders;

    // Separate SSO and phone&role orders
    const ssoOrders = targetOrders.filter(o => o.type === 'sso');
    const phoneOrders = targetOrders.filter(o => (o.type || 'phone&role') === 'phone&role');

    // --- SSO items: { type, clientId, miniappId, miniappName } ---
    const ssoItems = ssoOrders.map(o => {
      const { appName, appId, clientId } = getSSOExportFields(o);
      return {
        type: 'sso',
        clientId: clientId || o.clientId || '-',
        miniappId: appId || o.appId || '-',
        miniappName: appName || o.appName || '-'
      };
    });

    // --- Phone&Role: expand to 1 item per phone number, deduplicate by newest order ---
    const sortedPhoneOrders = [...phoneOrders].sort((a, b) => {
      const tsA = parseInt(a.id.replace('ord_', ''), 10) || 0;
      const tsB = parseInt(b.id.replace('ord_', ''), 10) || 0;
      return tsB - tsA; // newest first
    });

    // Map: phone -> first encountered (= most recent) item
    const phoneMap = new Map<string, object>();
    for (const o of sortedPhoneOrders) {
      const phones = (o.detectedPhone || '').split(',').map(p => p.trim()).filter(Boolean);
      for (const phone of phones) {
        if (!phoneMap.has(phone)) {
          phoneMap.set(phone, {
            type: 'phone&role',
            phoneNumber: phone,
            role: o.phoneRole
          });
        }
      }
    }

    // Combine: SSO first, then phone items
    const phoneItems = Array.from(phoneMap.values());
    const exportData = [...ssoItems, ...phoneItems];

    const jsonText = JSON.stringify(exportData, null, 2);
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      showToast('toastExportSuccess', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = jsonText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      showToast('toastExportSuccess', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const filteredOrders = orders.filter(o => {
    const oType = o.type || 'phone&role';
    if (selectedType !== 'all' && oType !== selectedType) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    const typeStr = oType.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
      typeStr.includes(term) ||
      o.detectedPhone.toLowerCase().includes(term) ||
      o.userName.toLowerCase().includes(term) ||
      o.userEmail.toLowerCase().includes(term) ||
      o.rawText.toLowerCase().includes(term)
    );
  });

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIdsSet = new Set(filteredOrders.map(o => o.id));
      setSelectedOrderIds(prev => prev.filter(id => !filteredIdsSet.has(id)));
    } else {
      const newSelected = new Set([...selectedOrderIds, ...filteredOrders.map(o => o.id)]);
      setSelectedOrderIds(Array.from(newSelected));
    }
  };

  const roleOptions: PhoneRole[] = ['poc', 'prod', 'full', 'admin', 'default'];

  const countPhoneRole = orders.filter(o => (o.type || 'phone&role') === 'phone&role').length;
  const countSSO = orders.filter(o => o.type === 'sso').length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            {t('ordersManagementTitle')}
          </h3>
          <p className="text-xs text-slate-400">{t('ordersManagementSub')}</p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                {t('deselectBtn')} ({selectedOrderIds.length})
              </button>
            )}

            {/* Complete Button for Admin */}
            <button
              type="button"
              disabled={selectedOrderIds.length === 0 || completing}
              onClick={handleCompleteOrders}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-lg transition duration-200 cursor-pointer active:scale-95 shrink-0 ${selectedOrderIds.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              title={
                selectedOrderIds.length > 0
                  ? `Đánh dấu ${selectedOrderIds.length} đơn hàng đã chọn thành Hoàn thành và gửi thông báo`
                  : 'Vui lòng chọn ít nhất 1 đơn hàng để hoàn thành'
              }
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              {completing ? t('completingBtn') : `${t('completeOrdersBtn')} (${selectedOrderIds.length})`}
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200 cursor-pointer active:scale-95 shrink-0"
              title={
                selectedOrderIds.length > 0
                  ? `Sao chép JSON của ${selectedOrderIds.length} đơn hàng được chọn`
                  : 'Sao chép JSON của tất cả đơn hàng'
              }
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
              ) : (
                <FileJson className="w-4 h-4 text-indigo-200" />
              )}
              {copied
                ? t('copiedJsonBtn')
                : selectedOrderIds.length > 0
                  ? `Export ${selectedOrderIds.length} Order`
                  : t('exportOrdersBtn')}
            </button>
          </div>
        )}
      </div>

      {/* Toolbar with Type Options Filter & Search */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Type Selection Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${selectedType === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t('filterAll')}
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${selectedType === 'all' ? 'bg-indigo-500/40 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('phone&role')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${selectedType === 'phone&role'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Phone className="w-3.5 h-3.5 text-indigo-400" />
            Phone & Roles
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${selectedType === 'phone&role' ? 'bg-indigo-500/40 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {countPhoneRole}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('sso')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${selectedType === 'sso'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            SSO Registry
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${selectedType === 'sso' ? 'bg-indigo-500/40 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {countSSO}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isAdmin && (
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      title="Chọn / Bỏ chọn tất cả"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4">{t('colOrderId')}</th>
                <th className="py-3.5 px-4">{t('colOrderType')}</th>
                <th className="py-3.5 px-4">{t('colUser')}</th>
                <th className="py-3.5 px-4">{t('colOrderContent')}</th>
                <th className="py-3.5 px-4">{t('colOrderStatus')}</th>
                <th className="py-3.5 px-4">{t('colOrderCreated')}</th>
                <th className="py-3.5 px-4 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-400 text-xs">
                    Loading orders from server...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-500 text-xs">
                    {t('noOrdersFound')}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSSO = order.type === 'sso';
                  const isSelected = selectedOrderIds.includes(order.id);

                  return (
                    <tr key={order.id} className={`hover:bg-slate-800/40 transition ${isSelected ? 'bg-indigo-950/30' : ''}`}>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(order.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono text-xs text-indigo-300 font-semibold">
                        {order.id}
                      </td>

                      {/* Type Column */}
                      <td className="py-3.5 px-4">
                        {isSSO ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-lg">
                            <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                            SSO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-lg">
                            <Phone className="w-3 h-3 text-indigo-400 shrink-0" />
                            Phone & Role
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-white">{order.userName}</div>
                        <div className="text-[11px] text-slate-400">{order.userEmail}</div>
                      </td>

                      {/* Merged Content Column */}
                      <td className="py-3.5 px-4 text-xs">
                        {isSSO ? (
                          <div className="space-y-0.5" title={order.rawText}>
                            <div className="text-white font-medium text-xs flex items-center gap-1.5">
                              <span className="text-cyan-300 font-bold">{order.appName || getSSOExportFields(order).appName || order.rawText}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span>App ID: <strong className="text-slate-200">{order.appId || getSSOExportFields(order).appId || '-'}</strong></span>
                              <span>Client ID: <strong className="text-slate-200">{order.clientId || getSSOExportFields(order).clientId || '-'}</strong></span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {order.detectedPhone.split(',').map((ph, idx) => (
                              <span key={idx} className="flex items-center gap-1 text-emerald-400 font-mono font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                {ph.trim()}
                              </span>
                            ))}
                            <span className="uppercase text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                              {order.phoneRole}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${order.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : order.status === 'Done'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : order.status === 'Approved'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                          {order.status === 'Done' ? t('statusDone') : order.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {order.createdAt}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition cursor-pointer"
                            title="Sửa đơn hàng"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Xóa đơn hàng"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">{t('editOrderModalTitle')}</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('enterPhoneTextLabel')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={editRawText}
                  onChange={(e) => setEditRawText(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('selectPhoneRoleLabel')}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as PhoneRole)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trạng thái Đơn hàng (Admin Status)
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Done">{t('statusDone')}</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {t('saveChangesBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">{t('confirmDeleteTitle')}</h4>
            <p className="text-xs text-slate-400 mt-1 mb-5">{t('confirmDeleteSub')}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                {t('cancelBtn')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                {t('deleteNowBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
