// app/components/AuthWrapper.tsx
'use client';

import { useUserStore } from '../store/useUserStore';
import { useEffect } from 'react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}