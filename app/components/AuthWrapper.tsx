// app/components/AuthWrapper.tsx
'use client';

import { useUserStore } from '../store/useUserStore';
import { useEffect } from 'react';
import { initializeTabSession } from '@/lib/utils/session';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  useEffect(() => {
    // 1. 先初始化标签页会话（检测并清除继承的 sessionStorage）
    initializeTabSession();
    
    // 2. 再初始化认证状态
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}