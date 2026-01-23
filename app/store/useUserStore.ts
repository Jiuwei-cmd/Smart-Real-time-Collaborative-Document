// store/useUserStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { setSessionUserId, clearSessionUserId } from '@/lib/utils/session';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initializeAuth: () => void; // 👈 改名：从 fetchUser → initializeAuth（更准确）
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  devtools((set) => {
    // 1. 创建监听器引用（用于后续清理）
    let authListener: (() => void) | null = null;

    return {
      user: null,
      loading: true,
      error: null,

      // ✅ 新方法：初始化认证监听
      initializeAuth: () => {
        // 防止重复初始化
        if (authListener) return;

        const supabase = createClientSupabaseClient();

        // 2. 立即获取当前用户（首次加载）
        supabase.auth.getUser().then(({ data: { user }, error }) => {
          if (error) {
            console.error('Supabase getUser error:', error);
            set({ user: null, loading: false, error: error.message });
            clearSessionUserId(); // 清除 sessionStorage
          } else {
            set({ user, loading: false, error: null });
            // 保存用户 ID 到 sessionStorage
            if (user) {
              setSessionUserId(user.id);
            }
          }
        });

        // 3. 👇 关键：监听后续的认证状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_, session) => {
            set({
              user: session?.user ?? null,
              loading: false,
              error: null,
            });
            // 同步更新 sessionStorage
            if (session?.user) {
              setSessionUserId(session.user.id);
            } else {
              clearSessionUserId();
            }
          }
        );

        // 4. 保存清理函数（可选，但推荐）
        authListener = () => {
          subscription.unsubscribe();
          authListener = null;
        };
      },

      // 清理用户状态（通常不需要手动调用，除非特殊场景）
      clearUser: () => {
        set({ user: null, loading: false, error: null });
        clearSessionUserId(); // 清除 sessionStorage
      },
    };
  })
);