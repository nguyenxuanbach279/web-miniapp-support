'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';
import { ToastProvider } from '@/lib/toast-context';
import { AuthCard } from '@/components/auth/AuthCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

function MainAppContent() {
  const { currentUser, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthCard />;
  }

  return <DashboardLayout />;
}

export default function Home() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
