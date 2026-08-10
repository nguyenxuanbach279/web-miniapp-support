'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-slate-800/80 border border-slate-700/80 p-0.5 rounded-xl text-xs">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${language === 'en'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-white'
          }`}
      >
        ENG
      </button>
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${language === 'vi'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-white'
          }`}
      >
        VN
      </button>
    </div>
  );
};
