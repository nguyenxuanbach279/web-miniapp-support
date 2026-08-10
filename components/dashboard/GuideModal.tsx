'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { HelpCircle, Check, X, Info } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleKey: 'ssoGuideTitle' | 'phoneGuideTitle';
  contentKey: 'ssoGuideContent' | 'phoneGuideContent';
  storageKey: string;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  titleKey,
  contentKey,
  storageKey
}) => {
  const { t } = useLanguage();
  const [dontShow, setDontShow] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShow) {
      localStorage.setItem(storageKey, 'true');
    }
    onClose();
  };

  const textContent = t(contentKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t(titleKey)}</h3>
            <p className="text-xs text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
              <Info className="w-3.5 h-3.5" /> Instructions & Workflow
            </p>
          </div>
        </div>

        {/* Modal Content Text */}
        <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-xs text-slate-300 leading-relaxed space-y-2 max-h-72 overflow-y-auto">
          {textContent.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Footer controls: Checkbox & Got It Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>{t('dontShowAgain')}</span>
          </label>

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {t('guideGotItBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
