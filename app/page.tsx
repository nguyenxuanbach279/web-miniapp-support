'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';
import { ToastProvider } from '@/lib/toast-context';
import { AuthCard } from '@/components/auth/AuthCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

function MainAppContent() {
  const { currentUser } = useAuth();

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
