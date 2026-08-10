'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/types';
import { useToast } from '@/lib/toast-context';
import { useLanguage } from '@/lib/language-context';
import {
  X,
  ShieldCheck,
  Phone,
  Clock,
  User,
  AlertCircle,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen || !order) return null;

  const isSSO = order.type === 'sso';

  const statusLabel = () => {
    if (order.status === 'Done') return t('statusDone');
    if (order.status === 'Pending') return t('statusPending');
    if (order.status === 'Approved') return t('statusApproved');
    if (order.status === 'Rejected') return t('statusRejected');
    return order.status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className={`p-3 rounded-2xl ${isSSO ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'}`}>
            {isSSO ? <ShieldCheck className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{t('orderDetailTitle')}</h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${order.status === 'Done'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : order.status === 'Pending'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}>
                {statusLabel()}
              </span>
            </div>
            <p className="text-xs font-mono text-indigo-300 mt-0.5">{order.id}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* User Info */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              {t('orderRegisteredByLabel')}
            </span>
            <div className="text-xs font-bold text-white truncate">{order.userName}</div>
            <div className="text-[11px] text-slate-400 truncate">{order.userEmail}</div>
          </div>

          {/* Type Info */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              {t('orderTypeLabel')}
            </span>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              {isSSO ? (
                <span className="text-cyan-300 font-bold">{t('orderTypeSSO')}</span>
              ) : (
                <span className="text-indigo-300 font-bold">{t('orderTypePhone')}</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {t('orderEnvRoleLabel')} <span className="font-mono font-bold text-white uppercase">{order.phoneRole}</span>
            </div>
          </div>

          {/* Created At */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {t('orderCreatedAtLabel')}
            </span>
            <div className="text-xs font-mono font-bold text-slate-200">{order.createdAt}</div>
          </div>

          {/* Completed At */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {t('orderCompletedAtLabel')}
            </span>
            <div className="text-xs font-mono font-bold text-emerald-400">
              {order.completedAt ? new Date(order.completedAt).toLocaleString('vi-VN') : t('notCompleted')}
            </div>
          </div>
        </div>

        {/* Content Details Box */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            {t('orderContentTitle')}
          </div>

          {isSSO ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">MiniApp Name:</span>
                <span className="font-bold text-cyan-300">{order.appName || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">MiniApp ID:</span>
                <span className="font-mono text-slate-200">{order.appId || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Client ID:</span>
                <span className="font-mono text-indigo-300 font-bold">{order.clientId || '-'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1.5 border-b border-slate-800/60 gap-1">
                <span className="text-slate-400">
                  {t('orderPhoneExtractedLabel')} {order.detectedPhone.split(',').length > 1 && `(${order.detectedPhone.split(',').length} số)`}:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {order.detectedPhone.split(',').map((ph, idx) => (
                    <span key={idx} className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {ph.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{t('orderPhoneRoleLabel')}</span>
                <span className="font-bold uppercase text-slate-200">{order.phoneRole}</span>
              </div>
            </div>
          )}
        </div>

        {/* Notice Alert Box */}
        {isSSO ? (
          <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-cyan-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span>{t('orderSSONotice')}</span>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{t('orderPhoneNotice')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
