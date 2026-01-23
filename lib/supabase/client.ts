// src/lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * 自定义存储适配器：使用 sessionStorage 替代 localStorage
 * 这样每个标签页都有独立的认证状态
 */
const sessionStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },
};

export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return sessionStorageAdapter.getItem(name) ?? undefined;
        },
        set(name: string, value: string, _options?: Record<string, unknown>) {
          sessionStorageAdapter.setItem(name, value);
        },
        remove(name: string, _options?: Record<string, unknown>) {
          sessionStorageAdapter.removeItem(name);
        },
      },
    }
  );
}